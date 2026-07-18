import { Inject, Injectable } from '@nestjs/common';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { StorageService } from '../../storage/services/storage.service';
import {
  PAYMENT_DEFAULT_CURRENCY,
  PAYMENT_PROVIDER,
  PAYMENT_REPOSITORY,
  RETRYABLE_ORDER_STATUSES,
} from '../constants/payment.constants';
import type { AssignSubscriptionDto, RetryOrderDto } from '../dto/assign-subscription.dto';
import type { AttachInvoicePdfDto } from '../dto/attach-invoice-pdf.dto';
import type { CreateCouponDto, UpdateCouponDto } from '../dto/coupon.dto';
import type {
  ListCouponsQueryDto,
  ListInvoicesQueryDto,
  ListOrdersQueryDto,
  ListPlansQueryDto,
  ListRefundsQueryDto,
  ListSubscriptionsQueryDto,
  OrganizationScopedQueryDto,
} from '../dto/payment-query.dto';
import type {
  AdminPaymentOverviewResponseDto,
  CouponResponseDto,
  InvoiceResponseDto,
  OrderResponseDto,
  PaginatedCouponsResponseDto,
  PaginatedInvoicesResponseDto,
  PaginatedPlansResponseDto,
  PaginatedRefundsResponseDto,
  PaginatedSubscriptionsResponseDto,
  PaginatedTransactionsResponseDto,
  PlanResponseDto,
  RefundResponseDto,
  SubscriptionResponseDto,
} from '../dto/payment-response.dto';
import type { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import type { CreateRefundDto } from '../dto/refund.dto';
import {
  CouponConflictException,
  CouponInvalidException,
  CouponNotFoundException,
  IdempotencyKeyConflictException,
  InvalidOrderStateException,
  InvalidRefundAmountException,
  InvoiceNotFoundException,
  PaymentNotFoundException,
  PaymentOrderNotFoundException,
  PaymentProviderUnavailableException,
  PlanConflictException,
  PlanNotFoundException,
} from '../exceptions';
import type { PaymentsRepository, RefundRecord } from '../interfaces/payments-repository.interface';
import { PaymentsMapper } from '../mappers/payments.mapper';
import type { PaymentProvider } from '../providers/payment-provider.interface';
import {
  addBillingInterval,
  assertOrganizationAccess,
  pageMeta,
  requireIdempotencyKey,
  resolveOrganizationId,
} from './payment-shared';
import { PaymentsService } from './payments.service';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class PaymentsAdminService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PaymentsRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProvider,
    private readonly paymentsService: PaymentsService,
    private readonly businessEmail?: BusinessEmailService,
    private readonly storageService?: StorageService,
  ) {}

  // ── Overview ───────────────────────────────────────────────────────────

  async getOverview(
    user: AuthenticatedUser,
    query: OrganizationScopedQueryDto,
  ): Promise<ControllerSuccessPayload<AdminPaymentOverviewResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [overview, currency] = await Promise.all([
      this.repository.getOverview(organizationId, monthStart),
      this.repository.findOrganizationCurrency(organizationId),
    ]);

    return {
      message: 'Payment overview retrieved successfully.',
      data: PaymentsMapper.toOverviewResponse(
        organizationId,
        currency ?? PAYMENT_DEFAULT_CURRENCY,
        overview,
      ),
    };
  }

  // ── Plans ──────────────────────────────────────────────────────────────

  async listPlans(
    user: AuthenticatedUser,
    query: ListPlansQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedPlansResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const isActive = query.isActive ?? (query.status ? query.status === 'active' : undefined);
    const result = await this.repository.listPlans({
      organizationId,
      isActive,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Plans retrieved successfully.',
      data: {
        items: PaymentsMapper.toPlanResponseList(result.items),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async createPlan(
    user: AuthenticatedUser,
    dto: CreatePlanDto,
  ): Promise<ControllerSuccessPayload<PlanResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);
    try {
      const plan = await this.repository.createPlan({
        organizationId: dto.organizationId,
        createdById: user.id,
        tier: dto.tier ?? 'BASIC',
        name: dto.name,
        description: dto.description,
        interval: dto.interval,
        amountMinor: dto.priceMinor,
        currency: dto.currency,
        trialDays: dto.trialDays,
        features: dto.features,
        isActive: dto.isActive,
      });
      return {
        message: 'Plan created successfully.',
        data: PaymentsMapper.toPlanResponse(plan),
      };
    } catch (error: unknown) {
      if (isPrismaUniqueConflict(error)) {
        throw new PlanConflictException();
      }
      throw error;
    }
  }

  async updatePlan(
    user: AuthenticatedUser,
    planId: string,
    dto: UpdatePlanDto,
  ): Promise<ControllerSuccessPayload<PlanResponseDto>> {
    const plan = await this.requirePlanAccess(user, planId);

    try {
      const updated = await this.repository.updatePlan(plan.id, {
        name: dto.name,
        description: dto.description,
        amountMinor: dto.priceMinor,
        currency: dto.currency,
        interval: dto.interval,
        tier: dto.tier,
        trialDays: dto.trialDays,
        features: dto.features,
        isActive: dto.isActive,
      });

      await this.repository.audit({
        userId: user.id,
        action: 'payment.plan.update',
        entity: 'Plan',
        entityId: plan.id,
        metadata: {
          organizationId: plan.organizationId,
          changes: Object.keys(dto),
        },
      });

      return {
        message: 'Plan updated successfully.',
        data: PaymentsMapper.toPlanResponse(updated),
      };
    } catch (error: unknown) {
      if (isPrismaUniqueConflict(error)) {
        throw new PlanConflictException();
      }
      throw error;
    }
  }

  // ── Transactions / invoices ────────────────────────────────────────────

  async listTransactions(
    user: AuthenticatedUser,
    query: ListOrdersQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedTransactionsResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listTransactions({
      organizationId,
      status: query.status,
      purpose: query.purpose,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Transactions retrieved successfully.',
      data: {
        items: PaymentsMapper.toTransactionResponseList(result.items),
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

  async attachInvoicePdf(
    user: AuthenticatedUser,
    invoiceId: string,
    dto: AttachInvoicePdfDto,
  ): Promise<ControllerSuccessPayload<InvoiceResponseDto>> {
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice) throw new InvoiceNotFoundException();
    assertOrganizationAccess(user, invoice.organizationId);
    if (!this.storageService) {
      throw new PaymentProviderUnavailableException('Storage service is unavailable.');
    }
    const pdfUrl = await this.storageService.resolveAssetUrl(dto.pdfUrl, {
      organizationId: invoice.organizationId,
      entityType: 'INVOICE_PDF',
    });
    const updated = await this.repository.updateInvoicePdf(invoice.id, pdfUrl);
    return {
      message: 'Invoice PDF attached successfully.',
      data: PaymentsMapper.toInvoiceResponse(updated),
    };
  }

  // ── Refunds ────────────────────────────────────────────────────────────

  async listRefunds(
    user: AuthenticatedUser,
    query: ListRefundsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedRefundsResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listRefunds({
      organizationId,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Refunds retrieved successfully.',
      data: {
        items: PaymentsMapper.toRefundResponseList(result.items),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async createRefund(
    user: AuthenticatedUser,
    dto: CreateRefundDto,
    idempotencyKeyHeader: string | undefined,
  ): Promise<ControllerSuccessPayload<RefundResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);
    const idempotencyKey = requireIdempotencyKey(idempotencyKeyHeader);

    // Duplicate refund requests with the same key return the same refund.
    const existing = await this.repository.findRefundByIdempotencyKey(
      dto.organizationId,
      idempotencyKey,
    );
    if (existing) {
      if (existing.orderId !== dto.orderId || existing.amountMinor !== dto.amountMinor) {
        throw new IdempotencyKeyConflictException();
      }
      return {
        message: 'Refund already exists for this idempotency key.',
        data: PaymentsMapper.toRefundResponse(existing),
      };
    }

    const order = await this.repository.findOrderById(dto.orderId);
    if (order?.organizationId !== dto.organizationId) {
      throw new PaymentOrderNotFoundException();
    }

    const payment = await this.repository.findCapturedPaymentForOrder(order.id);
    if (!payment?.providerPaymentId) {
      throw new PaymentNotFoundException('No captured payment exists for this order.');
    }

    // The refundable balance excludes successful and in-flight refunds.
    const reserved = await this.repository.sumReservedRefundsMinor(payment.id);
    if (dto.amountMinor > payment.amountMinor - reserved) {
      throw new InvalidRefundAmountException(
        `The refundable balance is ${String(payment.amountMinor - reserved)} minor units.`,
      );
    }

    if (!this.provider.isConfigured()) {
      throw new PaymentProviderUnavailableException();
    }

    // Record the pending refund before contacting the provider.
    const refund = await this.repository.createRefund({
      organizationId: dto.organizationId,
      paymentId: payment.id,
      orderId: order.id,
      requestedById: user.id,
      provider: this.provider.name,
      idempotencyKey,
      amountMinor: dto.amountMinor,
      currency: payment.currency,
      reason: dto.reason,
    });

    let finalized: RefundRecord;
    try {
      const providerRefund = await this.provider.refundPayment({
        paymentId: payment.providerPaymentId,
        amount: dto.amountMinor,
        receipt: refund.id,
        notes: { refundId: refund.id, orderId: order.id },
      });

      const processed = providerRefund.status === 'processed';
      finalized = await this.repository.finalizeRefund({
        refundId: refund.id,
        status: processed ? 'PROCESSED' : 'PROCESSING',
        providerRefundId: providerRefund.id,
        processedAt: processed ? new Date() : undefined,
        actorUserId: user.id,
      });
    } catch (error: unknown) {
      finalized = await this.repository.finalizeRefund({
        refundId: refund.id,
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Provider refund call failed',
        actorUserId: user.id,
      });
      throw error;
    }
    if (finalized.status === 'PROCESSED') {
      await this.businessEmail?.refundProcessed(finalized.id);
    }

    return {
      message: 'Refund initiated successfully.',
      data: PaymentsMapper.toRefundResponse(finalized),
    };
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  async listSubscriptions(
    user: AuthenticatedUser,
    query: ListSubscriptionsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedSubscriptionsResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listSubscriptions({
      organizationId,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Subscriptions retrieved successfully.',
      data: {
        items: PaymentsMapper.toSubscriptionResponseList(result.items),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async assignSubscription(
    user: AuthenticatedUser,
    dto: AssignSubscriptionDto,
  ): Promise<ControllerSuccessPayload<SubscriptionResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);

    const plan = await this.repository.findPlanById(dto.organizationId, dto.planId);
    if (!plan?.isActive) {
      throw new PlanNotFoundException('The plan does not exist or is inactive.');
    }

    const periodStart = dto.startsAt ? new Date(dto.startsAt) : new Date();
    const periodEnd = addBillingInterval(periodStart, plan.interval);
    const trialEndsAt =
      plan.trialDays > 0 ? new Date(periodStart.getTime() + plan.trialDays * 86_400_000) : null;

    // Assigning supersedes any current active subscription; capture it first
    // so the cancellation email can reference the correct record.
    const previous = await this.repository.findCurrentSubscription(dto.organizationId);

    const subscription = await this.repository.assignSubscription({
      organizationId: dto.organizationId,
      planId: plan.id,
      actorUserId: user.id,
      periodStart,
      periodEnd,
      trialEndsAt,
      note: dto.note,
    });
    if (previous && previous.planId !== plan.id) {
      await this.businessEmail?.subscriptionCancelled(previous.id);
    }
    await this.businessEmail?.enqueueForOrganizationAdmins(dto.organizationId, {
      templateKey: previous?.planId === plan.id ? 'subscription_renewed' : 'subscription_started',
      actionPath: '/admin/payments/subscriptions',
      entityType: 'subscription',
      entityId: subscription.id,
      createdById: user.id,
    });

    return {
      message: 'Subscription assigned successfully.',
      data: PaymentsMapper.toSubscriptionResponse(subscription),
    };
  }

  // ── Coupons ────────────────────────────────────────────────────────────

  async listCoupons(
    user: AuthenticatedUser,
    query: ListCouponsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedCouponsResponseDto>> {
    const organizationId = resolveOrganizationId(user, query.organizationId);
    const result = await this.repository.listCoupons({
      organizationId,
      isActive: query.status ? query.status === 'active' : undefined,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Coupons retrieved successfully.',
      data: {
        items: PaymentsMapper.toCouponResponseList(result.items),
        meta: pageMeta(result.total, query.page, query.limit),
      },
    };
  }

  async createCoupon(
    user: AuthenticatedUser,
    dto: CreateCouponDto,
  ): Promise<ControllerSuccessPayload<CouponResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);
    this.validateCouponValues(dto.discountType, dto.discountValue, dto.currency);

    try {
      const coupon = await this.repository.createCoupon({
        organizationId: dto.organizationId,
        createdById: user.id,
        code: dto.code,
        name: dto.name ?? dto.code,
        description: dto.description,
        type: dto.discountType === 'percent' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
        amountOffMinor: dto.discountType === 'fixed' ? dto.discountValue : undefined,
        percentOffBps: dto.discountType === 'percent' ? dto.discountValue * 100 : undefined,
        currency: dto.discountType === 'fixed' ? dto.currency : undefined,
        minimumOrderMinor: dto.minimumOrderMinor,
        maximumDiscountMinor: dto.maximumDiscountMinor,
        maxRedemptions: dto.maxRedemptions,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive,
      });

      return {
        message: 'Coupon created successfully.',
        data: PaymentsMapper.toCouponResponse(coupon),
      };
    } catch (error: unknown) {
      if (isPrismaUniqueConflict(error)) {
        throw new CouponConflictException();
      }
      throw error;
    }
  }

  async updateCoupon(
    user: AuthenticatedUser,
    couponId: string,
    dto: UpdateCouponDto,
  ): Promise<ControllerSuccessPayload<CouponResponseDto>> {
    const coupon = await this.repository.findCouponById(couponId);
    if (!coupon) {
      throw new CouponNotFoundException();
    }
    assertOrganizationAccess(user, coupon.organizationId);

    if (dto.discountType !== undefined || dto.discountValue !== undefined) {
      const nextType = dto.discountType ?? (coupon.type === 'PERCENTAGE' ? 'percent' : 'fixed');
      const nextValue =
        dto.discountValue ??
        (coupon.type === 'PERCENTAGE'
          ? Math.round((coupon.percentOffBps ?? 0) / 100)
          : (coupon.amountOffMinor ?? 0));
      this.validateCouponValues(nextType, nextValue, dto.currency ?? coupon.currency ?? undefined);
    }

    const updated = await this.repository.updateCoupon(coupon.id, {
      name: dto.name,
      description: dto.description,
      ...(dto.discountType !== undefined || dto.discountValue !== undefined
        ? this.couponTypeUpdate(coupon, dto)
        : {}),
      currency: dto.currency,
      minimumOrderMinor: dto.minimumOrderMinor,
      maximumDiscountMinor: dto.maximumDiscountMinor,
      maxRedemptions: dto.maxRedemptions,
      startsAt: dto.startsAt !== undefined ? new Date(dto.startsAt) : undefined,
      expiresAt: dto.endsAt !== undefined ? new Date(dto.endsAt) : undefined,
      isActive: dto.isActive,
    });

    await this.repository.audit({
      userId: user.id,
      action: 'payment.coupon.update',
      entity: 'Coupon',
      entityId: coupon.id,
      metadata: {
        organizationId: coupon.organizationId,
        code: coupon.code,
        changes: Object.keys(dto),
      },
    });

    return {
      message: 'Coupon updated successfully.',
      data: PaymentsMapper.toCouponResponse(updated),
    };
  }

  // ── Order retry ────────────────────────────────────────────────────────

  async retryOrder(
    user: AuthenticatedUser,
    orderId: string,
    dto: RetryOrderDto,
    idempotencyKeyHeader: string | undefined,
  ): Promise<ControllerSuccessPayload<OrderResponseDto>> {
    assertOrganizationAccess(user, dto.organizationId);
    const idempotencyKey = requireIdempotencyKey(idempotencyKeyHeader);

    const order = await this.repository.findOrderById(orderId);
    if (order?.organizationId !== dto.organizationId) {
      throw new PaymentOrderNotFoundException();
    }
    if (!RETRYABLE_ORDER_STATUSES.includes(order.status)) {
      throw new InvalidOrderStateException(`Orders in status ${order.status} cannot be retried.`);
    }
    if (!this.provider.isConfigured()) {
      throw new PaymentProviderUnavailableException();
    }

    // A fresh provider order is issued; authoritative totals never change.
    const attached = await this.paymentsService.createProviderOrder(order, user.id);

    await this.repository.audit({
      userId: user.id,
      action: 'payment.order.retry',
      entity: 'Order',
      entityId: order.id,
      metadata: {
        organizationId: order.organizationId,
        idempotencyKey,
        previousStatus: order.status,
        providerOrderId: attached.providerOrderId,
      },
    });

    return {
      message: 'Order retried successfully.',
      data: PaymentsMapper.toOrderResponse(attached, this.provider.getPublicKeyId()),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async requirePlanAccess(
    user: AuthenticatedUser,
    planId: string,
  ): Promise<{ id: string; organizationId: string }> {
    for (const organizationId of user.organizationIds) {
      const plan = await this.repository.findPlanById(organizationId, planId);
      if (plan) {
        return { id: plan.id, organizationId: plan.organizationId };
      }
    }
    throw new PlanNotFoundException();
  }

  private validateCouponValues(
    discountType: 'percent' | 'fixed',
    discountValue: number,
    currency?: string,
  ): void {
    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
      throw new CouponInvalidException('Percent discounts must be between 1 and 100.');
    }
    if (discountType === 'fixed' && !currency) {
      throw new CouponInvalidException('Fixed-amount coupons require a currency.');
    }
  }

  private couponTypeUpdate(
    coupon: {
      type: 'PERCENTAGE' | 'FIXED_AMOUNT';
      percentOffBps: number | null;
      amountOffMinor: number | null;
    },
    dto: UpdateCouponDto,
  ): {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    percentOffBps: number | null;
    amountOffMinor: number | null;
  } {
    const nextType = dto.discountType ?? (coupon.type === 'PERCENTAGE' ? 'percent' : 'fixed');
    const nextValue =
      dto.discountValue ??
      (coupon.type === 'PERCENTAGE'
        ? Math.round((coupon.percentOffBps ?? 0) / 100)
        : (coupon.amountOffMinor ?? 0));

    if (nextType === 'percent') {
      return {
        type: 'PERCENTAGE',
        percentOffBps: nextValue * 100,
        amountOffMinor: null,
      };
    }
    return {
      type: 'FIXED_AMOUNT',
      amountOffMinor: nextValue,
      percentOffBps: null,
    };
  }
}
