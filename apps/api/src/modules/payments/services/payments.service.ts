import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  PAYMENT_DEFAULT_CURRENCY,
  PAYMENT_ORDER_TTL_MINUTES,
  PAYMENT_PROVIDER,
  PAYMENT_REPOSITORY,
  type BillingIntervalValue,
  type PlanTierValue,
} from '../constants/payment.constants';
import type { CreateOrderDto } from '../dto/create-order.dto';
import type {
  InvoiceResponseDto,
  OrderResponseDto,
  PaginatedHistoryResponseDto,
  PaginatedInvoicesResponseDto,
  PaginatedOrdersResponseDto,
  PaymentCatalogResponseDto,
  PaymentConfigResponseDto,
  SubscriptionResponseDto,
} from '../dto/payment-response.dto';
import type {
  ListInvoicesQueryDto,
  ListOrdersQueryDto,
  OrganizationScopedQueryDto,
} from '../dto/payment-query.dto';
import type { VerifyPaymentDto } from '../dto/verify-payment.dto';
import {
  AlreadyEnrolledException,
  BatchNotAvailableException,
  BillingAddressNotFoundException,
  CouponInvalidException,
  CourseNotPurchasableException,
  IdempotencyKeyConflictException,
  InvalidOrderRequestException,
  InvalidPaymentSignatureException,
  InvoiceNotFoundException,
  PaymentForbiddenException,
  PaymentOrderNotFoundException,
  PaymentProviderUnavailableException,
  PaymentVerificationMismatchException,
  PlanNotFoundException,
  StudentProfileRequiredException,
} from '../exceptions';
import type {
  CouponRecord,
  OrderRecord,
  PaymentsRepository,
} from '../interfaces/payments-repository.interface';
import { PaymentsMapper } from '../mappers/payments.mapper';
import type { PaymentProvider } from '../providers/payment-provider.interface';
import {
  assertOrganizationAccess,
  generateReceipt,
  isAdmin,
  pageMeta,
  requireIdempotencyKey,
  resolveOrganizationId,
  toSafePaymentMethod,
} from './payment-shared';

interface OrderPricing {
  purpose: 'COURSE_PURCHASE' | 'ORGANIZATION_SUBSCRIPTION';
  courseId?: string;
  batchId?: string;
  planId?: string;
  courseTitleSnapshot?: string;
  batchNameSnapshot?: string;
  planNameSnapshot?: string;
  planTierSnapshot?: PlanTierValue;
  intervalSnapshot?: BillingIntervalValue;
  subtotalMinor: number;
  currency: string;
}

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PaymentsRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProvider,
  ) {}

  // ── Config & catalog ───────────────────────────────────────────────────

  getConfig(): ControllerSuccessPayload<PaymentConfigResponseDto> {
    const configured = this.provider.isConfigured();
    return {
      message: 'Payment configuration retrieved successfully.',
      data: {
        configured,
        provider: this.provider.name,
        keyId: configured ? this.provider.getPublicKeyId() : null,
        currency: PAYMENT_DEFAULT_CURRENCY,
        message: configured
          ? null
          : 'Online payments are currently unavailable. Contact your administrator.',
      },
    };
  }

  async getCatalog(
    user: AuthenticatedUser,
    query: OrganizationScopedQueryDto,
  ): Promise<ControllerSuccessPayload<PaymentCatalogResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const [courses, plans, currency] = await Promise.all([
      this.repository.listCatalogCourses(organizationId),
      this.repository.listActivePlans(organizationId),
      this.repository.findOrganizationCurrency(organizationId),
    ]);

    return {
      message: 'Payment catalog retrieved successfully.',
      data: PaymentsMapper.toCatalogResponse(courses, plans, currency ?? PAYMENT_DEFAULT_CURRENCY),
    };
  }

  // ── Order creation ─────────────────────────────────────────────────────

  async createOrder(
    user: AuthenticatedUser,
    dto: CreateOrderDto,
    idempotencyKeyHeader: string | undefined,
  ): Promise<ControllerSuccessPayload<OrderResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);
    const idempotencyKey = requireIdempotencyKey(idempotencyKeyHeader);

    if (!this.provider.isConfigured()) {
      throw new PaymentProviderUnavailableException();
    }

    const existing = await this.repository.findOrderByIdempotencyKey(
      dto.organizationId,
      idempotencyKey,
    );
    if (existing) {
      this.assertSameOrderTarget(existing, user, dto);
      return {
        message: 'Order already exists for this idempotency key.',
        data: PaymentsMapper.toOrderResponse(existing, this.provider.getPublicKeyId()),
      };
    }

    const pricing = await this.priceOrder(user, dto);
    const coupon = dto.couponCode
      ? await this.requireValidCoupon(dto.organizationId, dto.couponCode, pricing)
      : null;
    const discountMinor = coupon ? this.computeDiscount(coupon, pricing.subtotalMinor) : 0;
    const totalMinor = pricing.subtotalMinor - discountMinor;
    if (totalMinor <= 0) {
      throw new InvalidOrderRequestException(
        'The order total must be positive. Free items do not require checkout.',
      );
    }

    const billingAddressSnapshot = await this.resolveBillingAddressSnapshot(
      user,
      dto.organizationId,
      dto.billingAddressId,
    );

    // Persist the local order before contacting the provider so a provider
    // failure never loses the audit trail and retries stay idempotent.
    let order: OrderRecord;
    try {
      order = await this.repository.createOrder({
        organizationId: dto.organizationId,
        customerId: user.id,
        createdById: user.id,
        provider: this.provider.name,
        purpose: pricing.purpose,
        courseId: pricing.courseId,
        batchId: pricing.batchId,
        planId: pricing.planId,
        couponId: coupon?.id,
        courseTitleSnapshot: pricing.courseTitleSnapshot,
        batchNameSnapshot: pricing.batchNameSnapshot,
        planNameSnapshot: pricing.planNameSnapshot,
        planTierSnapshot: pricing.planTierSnapshot,
        intervalSnapshot: pricing.intervalSnapshot,
        subtotalMinor: pricing.subtotalMinor,
        discountMinor,
        taxMinor: 0,
        totalMinor,
        currency: pricing.currency,
        idempotencyKey,
        receipt: generateReceipt(),
        billingAddressId: dto.billingAddressId,
        billingAddressSnapshot,
      });
    } catch (error: unknown) {
      if (isPrismaUniqueConflict(error)) {
        const racedOrder = await this.repository.findOrderByIdempotencyKey(
          dto.organizationId,
          idempotencyKey,
        );
        if (racedOrder) {
          this.assertSameOrderTarget(racedOrder, user, dto);
          return {
            message: 'Order already exists for this idempotency key.',
            data: PaymentsMapper.toOrderResponse(racedOrder, this.provider.getPublicKeyId()),
          };
        }
      }
      throw error;
    }

    const attached = await this.createProviderOrder(order, user.id);

    return {
      message: 'Order created successfully.',
      data: PaymentsMapper.toOrderResponse(attached, this.provider.getPublicKeyId()),
    };
  }

  /**
   * Creates the provider-side order for a persisted local order and records
   * the outcome. Shared by first-time creation and admin retry.
   */
  async createProviderOrder(order: OrderRecord, actorUserId: string): Promise<OrderRecord> {
    try {
      const providerOrder = await this.provider.createOrder({
        amount: order.totalMinor,
        currency: order.currency,
        receipt: order.receipt,
        notes: { orderId: order.id, organizationId: order.organizationId },
      });

      const expiresAt = new Date(Date.now() + PAYMENT_ORDER_TTL_MINUTES * 60_000);
      const attached = await this.repository.attachProviderOrder(
        order.id,
        providerOrder.id,
        expiresAt,
      );

      await this.repository.audit({
        userId: actorUserId,
        action: 'payment.order.create',
        entity: 'Order',
        entityId: order.id,
        metadata: {
          organizationId: order.organizationId,
          purpose: order.purpose,
          totalMinor: order.totalMinor,
          currency: order.currency,
          providerOrderId: providerOrder.id,
        },
      });

      return attached;
    } catch (error: unknown) {
      await this.repository.markOrderFailed(order.id);
      await this.repository.audit({
        userId: actorUserId,
        action: 'payment.order.provider_failed',
        entity: 'Order',
        entityId: order.id,
        metadata: {
          organizationId: order.organizationId,
          totalMinor: order.totalMinor,
          currency: order.currency,
          error: error instanceof Error ? error.message : 'Unknown provider error',
        },
      });
      throw error;
    }
  }

  // ── Verification (checkout callback) ───────────────────────────────────

  async verifyPayment(
    user: AuthenticatedUser,
    dto: VerifyPaymentDto,
  ): Promise<ControllerSuccessPayload<OrderResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);

    const order = await this.repository.findOrderById(dto.orderId);
    if (order?.organizationId !== dto.organizationId) {
      throw new PaymentOrderNotFoundException();
    }
    if (order.customerId !== user.id && !isAdmin(user)) {
      throw new PaymentForbiddenException();
    }
    if (!order.providerOrderId || order.providerOrderId !== dto.providerOrderId) {
      throw new PaymentVerificationMismatchException(
        'The provider order does not belong to this order.',
      );
    }

    // 1. Signature over order_id|payment_id must match before anything else.
    const signatureValid = this.provider.verifyCheckoutSignature({
      providerOrderId: dto.providerOrderId,
      providerPaymentId: dto.providerPaymentId,
      signature: dto.signature,
    });
    if (!signatureValid) {
      await this.repository.audit({
        userId: user.id,
        action: 'payment.payment.failed',
        entity: 'Order',
        entityId: order.id,
        metadata: {
          organizationId: order.organizationId,
          reason: 'Invalid checkout signature',
          providerPaymentId: dto.providerPaymentId,
        },
      });
      throw new InvalidPaymentSignatureException();
    }

    // 2. Repeated verify for an already-captured payment returns the result.
    const existingPayment = await this.repository.findPaymentByProviderPaymentId(
      this.provider.name,
      dto.providerPaymentId,
    );
    if (existingPayment?.status === 'CAPTURED' && order.status === 'PAID') {
      return {
        message: 'Payment already verified.',
        data: PaymentsMapper.toOrderResponse(order, this.provider.getPublicKeyId()),
      };
    }

    // 3. Never trust the client: fetch the payment from the provider and
    //    compare order linkage, amount, currency, and state.
    const providerPayment = await this.provider.getPayment(dto.providerPaymentId);
    if (providerPayment.orderId !== order.providerOrderId) {
      throw new PaymentVerificationMismatchException(
        'The payment belongs to a different provider order.',
      );
    }
    if (
      providerPayment.amount !== order.totalMinor ||
      providerPayment.currency.toUpperCase() !== order.currency.toUpperCase()
    ) {
      throw new PaymentVerificationMismatchException();
    }
    const captured = providerPayment.captured || providerPayment.status === 'captured';
    if (!captured && providerPayment.status !== 'authorized') {
      throw new PaymentVerificationMismatchException(
        `The payment is in state "${providerPayment.status}" and cannot be applied.`,
      );
    }

    const result = await this.repository.capturePayment({
      orderId: order.id,
      organizationId: order.organizationId,
      customerId: order.customerId,
      provider: this.provider.name,
      providerPaymentId: providerPayment.id,
      providerOrderId: providerPayment.orderId,
      amountMinor: providerPayment.amount,
      currency: providerPayment.currency.toUpperCase(),
      captured,
      paymentMethod: toSafePaymentMethod(providerPayment),
      actorUserId: user.id,
    });

    return {
      message: result.alreadyProcessed
        ? 'Payment already verified.'
        : captured
          ? 'Payment verified and captured successfully.'
          : 'Payment authorized; capture confirmation is pending.',
      data: PaymentsMapper.toOrderResponse(result.order, this.provider.getPublicKeyId()),
    };
  }

  // ── Reads ──────────────────────────────────────────────────────────────

  async listOrders(
    user: AuthenticatedUser,
    query: ListOrdersQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedOrdersResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listOrders({
      organizationId,
      customerId: user.id,
      status: query.status,
      purpose: query.purpose,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Orders retrieved successfully.',
      data: {
        items: PaymentsMapper.toOrderResponseList(result.items, this.provider.getPublicKeyId()),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async getHistory(
    user: AuthenticatedUser,
    query: ListOrdersQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedHistoryResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listOrders({
      organizationId,
      customerId: user.id,
      status: query.status,
      purpose: query.purpose,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Payment history retrieved successfully.',
      data: {
        items: result.items.map((order) => PaymentsMapper.toHistoryItem(order)),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async listInvoices(
    user: AuthenticatedUser,
    query: ListInvoicesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedInvoicesResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listInvoices({
      organizationId,
      customerId: user.id,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Invoices retrieved successfully.',
      data: {
        items: PaymentsMapper.toInvoiceResponseList(result.items),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async getInvoiceById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<InvoiceResponseDto>> {
    const invoice = await this.repository.findInvoiceById(id);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    assertOrganizationAccess(user, invoice.organizationId);
    if (invoice.customerId !== user.id && !isAdmin(user)) {
      throw new PaymentForbiddenException();
    }

    return {
      message: 'Invoice retrieved successfully.',
      data: PaymentsMapper.toInvoiceResponse(invoice),
    };
  }

  async getCurrentSubscription(
    user: AuthenticatedUser,
    query: OrganizationScopedQueryDto,
  ): Promise<ControllerSuccessPayload<SubscriptionResponseDto | null>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const subscription = await this.repository.findCurrentSubscription(organizationId);

    return {
      message: subscription
        ? 'Current subscription retrieved successfully.'
        : 'No active subscription.',
      data: subscription ? PaymentsMapper.toSubscriptionResponse(subscription) : null,
    };
  }

  // ── Pricing helpers (authoritative amounts) ────────────────────────────

  private async priceOrder(user: AuthenticatedUser, dto: CreateOrderDto): Promise<OrderPricing> {
    if (dto.purpose === 'COURSE_PURCHASE') {
      return this.priceCourseOrder(user, dto);
    }
    return this.priceSubscriptionOrder(user, dto);
  }

  private async priceCourseOrder(
    user: AuthenticatedUser,
    dto: CreateOrderDto,
  ): Promise<OrderPricing> {
    if (!dto.courseId || !dto.batchId) {
      throw new InvalidOrderRequestException(
        'courseId and batchId are required for course purchases.',
      );
    }

    const course = await this.repository.findCourseForPurchase(dto.organizationId, dto.courseId);
    if (course?.status !== 'PUBLISHED' || !course.isPurchasable) {
      throw new CourseNotPurchasableException();
    }
    if (course.priceMinor <= 0) {
      throw new InvalidOrderRequestException('This course does not require payment.');
    }

    const batch = await this.repository.findBatchForEnrollment(dto.organizationId, dto.batchId);
    if (batch?.courseId !== course.id) {
      throw new BatchNotAvailableException('The batch does not belong to this course.');
    }
    if (batch.status !== 'ACTIVE' && batch.status !== 'UPCOMING') {
      throw new BatchNotAvailableException();
    }

    const studentProfileId = await this.repository.findStudentProfileId(
      dto.organizationId,
      user.id,
    );
    if (!studentProfileId) {
      throw new StudentProfileRequiredException();
    }
    if (await this.repository.hasActiveEnrollment(batch.id, studentProfileId)) {
      throw new AlreadyEnrolledException();
    }

    return {
      purpose: 'COURSE_PURCHASE',
      courseId: course.id,
      batchId: batch.id,
      courseTitleSnapshot: course.title,
      batchNameSnapshot: batch.name,
      subtotalMinor: course.priceMinor,
      currency: course.currency.toUpperCase(),
    };
  }

  private async priceSubscriptionOrder(
    user: AuthenticatedUser,
    dto: CreateOrderDto,
  ): Promise<OrderPricing> {
    if (!isAdmin(user)) {
      throw new PaymentForbiddenException('Only organization admins can purchase subscriptions.');
    }
    if (!dto.planId) {
      throw new InvalidOrderRequestException('planId is required for subscription purchases.');
    }

    const plan = await this.repository.findPlanById(dto.organizationId, dto.planId);
    if (!plan?.isActive) {
      throw new PlanNotFoundException('The plan does not exist or is inactive.');
    }
    if (plan.amountMinor <= 0) {
      throw new InvalidOrderRequestException(
        'Free plans are assigned by an administrator and do not require checkout.',
      );
    }

    return {
      purpose: 'ORGANIZATION_SUBSCRIPTION',
      planId: plan.id,
      planNameSnapshot: plan.name,
      planTierSnapshot: plan.tier,
      intervalSnapshot: plan.interval,
      subtotalMinor: plan.amountMinor,
      currency: plan.currency.toUpperCase(),
    };
  }

  private async requireValidCoupon(
    organizationId: string,
    code: string,
    pricing: OrderPricing,
  ): Promise<CouponRecord> {
    const coupon = await this.repository.findCouponByCode(organizationId, code);
    if (!coupon?.isActive) {
      throw new CouponInvalidException('This coupon does not exist or is inactive.');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new CouponInvalidException('This coupon is not active yet.');
    }
    if (coupon.expiresAt && coupon.expiresAt <= now) {
      throw new CouponInvalidException('This coupon has expired.');
    }
    if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
      throw new CouponInvalidException('This coupon has reached its redemption limit.');
    }
    if (coupon.currency && coupon.currency.toUpperCase() !== pricing.currency) {
      throw new CouponInvalidException('This coupon applies to a different currency.');
    }
    if (coupon.minimumOrderMinor !== null && pricing.subtotalMinor < coupon.minimumOrderMinor) {
      throw new CouponInvalidException('The order subtotal is below the coupon minimum.');
    }

    return coupon;
  }

  private computeDiscount(coupon: CouponRecord, subtotalMinor: number): number {
    let discount: number;
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.floor((subtotalMinor * (coupon.percentOffBps ?? 0)) / 10_000);
      if (coupon.maximumDiscountMinor !== null) {
        discount = Math.min(discount, coupon.maximumDiscountMinor);
      }
    } else {
      discount = coupon.amountOffMinor ?? 0;
    }
    return Math.max(0, Math.min(discount, subtotalMinor));
  }

  private assertSameOrderTarget(
    existing: OrderRecord,
    user: AuthenticatedUser,
    dto: CreateOrderDto,
  ): void {
    const sameTarget =
      existing.customerId === user.id &&
      existing.purpose === dto.purpose &&
      existing.courseId === (dto.courseId ?? null) &&
      existing.batchId === (dto.batchId ?? null) &&
      existing.planId === (dto.planId ?? null) &&
      (existing.couponCode ?? null) === (dto.couponCode ?? null);
    if (!sameTarget) {
      throw new IdempotencyKeyConflictException();
    }
  }

  private async resolveBillingAddressSnapshot(
    user: AuthenticatedUser,
    organizationId: string,
    billingAddressId?: string,
  ): Promise<Record<string, unknown>> {
    if (billingAddressId) {
      const address = await this.repository.findBillingAddress(organizationId, billingAddressId);
      // An address must belong to the organization and, when user-owned,
      // to the purchasing user.
      if (!address || (address.userId !== null && address.userId !== user.id)) {
        throw new BillingAddressNotFoundException();
      }
      return {
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
        phone: address.phone,
      };
    }

    const contact = await this.repository.findCustomerContact(user.id);
    if (!contact) {
      this.logger.warn(`Customer contact missing for user ${user.id}`);
      return {};
    }
    return { fullName: contact.name, email: contact.email };
  }
}
