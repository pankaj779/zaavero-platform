import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import {
  REFUND_RESERVING_STATUSES,
  type BillingIntervalValue,
} from '../constants/payment.constants';
import { PaymentOrderNotFoundException } from '../exceptions';
import type {
  AssignSubscriptionData,
  AuditEntry,
  BatchForEnrollmentRecord,
  BillingAddressRecord,
  CapturePaymentData,
  CapturePaymentResult,
  CatalogCourseRecord,
  CouponRecord,
  CourseForPurchaseRecord,
  CreateCouponData,
  CreateOrderData,
  CreatePaymentEventData,
  CreatePlanData,
  CreateRefundData,
  FinalizeRefundData,
  InvoiceRecord,
  ListResult,
  OrderRecord,
  PaymentEventRecord,
  PaymentListFilters,
  PaymentOverviewRecord,
  PaymentRecord,
  PaymentsRepository,
  PlanRecord,
  RecordPaymentFailureData,
  RefundRecord,
  SubscriptionRecord,
  TransactionRecord,
  UpdateCouponData,
  UpdatePaymentEventData,
  UpdatePlanData,
} from '../interfaces/payments-repository.interface';

const orderSelect = {
  id: true,
  organizationId: true,
  customerId: true,
  provider: true,
  purpose: true,
  status: true,
  courseId: true,
  batchId: true,
  planId: true,
  couponId: true,
  coupon: { select: { code: true } },
  courseTitleSnapshot: true,
  batchNameSnapshot: true,
  planNameSnapshot: true,
  intervalSnapshot: true,
  subtotalMinor: true,
  discountMinor: true,
  taxMinor: true,
  totalMinor: true,
  currency: true,
  idempotencyKey: true,
  receipt: true,
  providerOrderId: true,
  expiresAt: true,
  paidAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type OrderRow = {
  coupon: { code: string } | null;
} & Omit<OrderRecord, 'couponCode'>;

function toOrderRecord(row: OrderRow): OrderRecord {
  const { coupon, ...rest } = row;
  return { ...rest, couponCode: coupon?.code ?? null };
}

const paymentSelect = {
  id: true,
  organizationId: true,
  orderId: true,
  customerId: true,
  provider: true,
  providerPaymentId: true,
  providerOrderId: true,
  amountMinor: true,
  currency: true,
  status: true,
  failureCode: true,
  failureReason: true,
  authorizedAt: true,
  capturedAt: true,
  refundedMinor: true,
  createdAt: true,
  updatedAt: true,
} as const;

const invoiceSelect = {
  id: true,
  organizationId: true,
  orderId: true,
  customerId: true,
  invoiceNumber: true,
  status: true,
  subtotalMinor: true,
  discountMinor: true,
  taxMinor: true,
  totalMinor: true,
  currency: true,
  issuedAt: true,
  paidAt: true,
  createdAt: true,
  customer: { select: { firstName: true, lastName: true, email: true } },
  order: {
    select: {
      purpose: true,
      courseTitleSnapshot: true,
      batchNameSnapshot: true,
      planNameSnapshot: true,
    },
  },
} as const;

interface InvoiceRow {
  id: string;
  organizationId: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceRecord['status'];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  issuedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  customer: { firstName: string; lastName: string; email: string } | null;
  order: {
    purpose: InvoiceRecord['orderPurpose'];
    courseTitleSnapshot: string | null;
    batchNameSnapshot: string | null;
    planNameSnapshot: string | null;
  } | null;
}

function toInvoiceRecord(row: InvoiceRow): InvoiceRecord {
  const { customer, order, ...rest } = row;
  return {
    ...rest,
    customerName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : null,
    customerEmail: customer?.email ?? null,
    orderPurpose: order?.purpose ?? null,
    courseTitleSnapshot: order?.courseTitleSnapshot ?? null,
    batchNameSnapshot: order?.batchNameSnapshot ?? null,
    planNameSnapshot: order?.planNameSnapshot ?? null,
  };
}

const planSelect = {
  id: true,
  organizationId: true,
  tier: true,
  name: true,
  description: true,
  interval: true,
  amountMinor: true,
  currency: true,
  trialDays: true,
  features: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const subscriptionSelect = {
  id: true,
  organizationId: true,
  planId: true,
  status: true,
  planNameSnapshot: true,
  planTierSnapshot: true,
  intervalSnapshot: true,
  amountMinorSnapshot: true,
  currency: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  trialEndsAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const couponSelect = {
  id: true,
  organizationId: true,
  code: true,
  name: true,
  description: true,
  type: true,
  amountOffMinor: true,
  percentOffBps: true,
  currency: true,
  minimumOrderMinor: true,
  maximumDiscountMinor: true,
  maxRedemptions: true,
  redemptionCount: true,
  startsAt: true,
  expiresAt: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const refundSelect = {
  id: true,
  organizationId: true,
  paymentId: true,
  orderId: true,
  provider: true,
  providerRefundId: true,
  idempotencyKey: true,
  amountMinor: true,
  currency: true,
  status: true,
  reason: true,
  failureCode: true,
  failureReason: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const paymentEventSelect = {
  id: true,
  provider: true,
  eventId: true,
  type: true,
  status: true,
  attempts: true,
  lastError: true,
  processedAt: true,
  receivedAt: true,
} as const;

function generateInvoiceNumber(): string {
  const now = new Date();
  const stamp = `${String(now.getFullYear())}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `INV-${stamp}-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function addBillingInterval(start: Date, interval: BillingIntervalValue): Date {
  const end = new Date(start);
  if (interval === 'MONTHLY') {
    end.setMonth(end.getMonth() + 1);
  } else if (interval === 'QUARTERLY') {
    end.setMonth(end.getMonth() + 3);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
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
export class PrismaPaymentsRepository implements PaymentsRepository {
  public readonly marker = 'payments-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  // ── Lookups ────────────────────────────────────────────────────────────

  async findOrganizationCurrency(organizationId: string): Promise<string | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { currency: true },
    });
    return organization?.currency ?? null;
  }

  async findCourseForPurchase(
    organizationId: string,
    courseId: string,
  ): Promise<CourseForPurchaseRecord | null> {
    return this.prisma.course.findFirst({
      where: { id: courseId, organizationId, deletedAt: null },
      select: {
        id: true,
        title: true,
        priceMinor: true,
        currency: true,
        status: true,
        isPurchasable: true,
      },
    });
  }

  async findBatchForEnrollment(
    organizationId: string,
    batchId: string,
  ): Promise<BatchForEnrollmentRecord | null> {
    return this.prisma.batch.findFirst({
      where: { id: batchId, organizationId, deletedAt: null },
      select: { id: true, name: true, courseId: true, status: true },
    });
  }

  async findStudentProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  async hasActiveEnrollment(batchId: string, studentProfileId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        batchId,
        studentId: studentProfileId,
        NOT: { status: 'DROPPED' },
      },
      select: { id: true },
    });
    return enrollment !== null;
  }

  async findBillingAddress(
    organizationId: string,
    billingAddressId: string,
  ): Promise<BillingAddressRecord | null> {
    return this.prisma.billingAddress.findFirst({
      where: { id: billingAddressId, organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        fullName: true,
        line1: true,
        line2: true,
        city: true,
        state: true,
        postalCode: true,
        countryCode: true,
        phone: true,
      },
    });
  }

  async findCustomerContact(userId: string): Promise<{ name: string; email: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    if (!user) {
      return null;
    }
    return { name: `${user.firstName} ${user.lastName}`.trim(), email: user.email };
  }

  // ── Catalog ────────────────────────────────────────────────────────────

  async listCatalogCourses(organizationId: string): Promise<CatalogCourseRecord[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'PUBLISHED',
        isPurchasable: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        priceMinor: true,
        currency: true,
        status: true,
        isPurchasable: true,
        batches: {
          where: { deletedAt: null, status: { in: ['UPCOMING', 'ACTIVE'] } },
          select: { id: true, name: true, courseId: true, status: true },
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return courses;
  }

  async listActivePlans(organizationId: string): Promise<PlanRecord[]> {
    return this.prisma.plan.findMany({
      where: { organizationId, isActive: true },
      select: planSelect,
      orderBy: { amountMinor: 'asc' },
    });
  }

  // ── Orders ─────────────────────────────────────────────────────────────

  async createOrder(data: CreateOrderData): Promise<OrderRecord> {
    const row = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          organizationId: data.organizationId,
          customerId: data.customerId,
          createdById: data.createdById,
          provider: data.provider as never,
          purpose: data.purpose,
          status: 'DRAFT',
          courseId: data.courseId,
          batchId: data.batchId,
          planId: data.planId,
          couponId: data.couponId,
          courseTitleSnapshot: data.courseTitleSnapshot,
          batchNameSnapshot: data.batchNameSnapshot,
          planNameSnapshot: data.planNameSnapshot,
          planTierSnapshot: data.planTierSnapshot,
          intervalSnapshot: data.intervalSnapshot,
          subtotalMinor: data.subtotalMinor,
          discountMinor: data.discountMinor,
          taxMinor: data.taxMinor,
          totalMinor: data.totalMinor,
          currency: data.currency,
          idempotencyKey: data.idempotencyKey,
          receipt: data.receipt,
        },
        select: orderSelect,
      });

      await tx.invoice.create({
        data: {
          organizationId: data.organizationId,
          orderId: order.id,
          customerId: data.customerId,
          billingAddressId: data.billingAddressId,
          invoiceNumber: generateInvoiceNumber(),
          status: 'DRAFT',
          subtotalMinor: data.subtotalMinor,
          discountMinor: data.discountMinor,
          taxMinor: data.taxMinor,
          totalMinor: data.totalMinor,
          currency: data.currency,
          billingAddressSnapshot: data.billingAddressSnapshot as never,
        },
      });

      return order;
    });

    return toOrderRecord(row);
  }

  async findOrderById(id: string): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      select: orderSelect,
    });
    return row ? toOrderRecord(row) : null;
  }

  async findOrderByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId, idempotencyKey },
      },
      select: orderSelect,
    });
    return row ? toOrderRecord(row) : null;
  }

  async findOrderByProviderOrderId(
    provider: string,
    providerOrderId: string,
  ): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findUnique({
      where: {
        provider_providerOrderId: {
          provider: provider as never,
          providerOrderId,
        },
      },
      select: orderSelect,
    });
    return row ? toOrderRecord(row) : null;
  }

  async attachProviderOrder(
    orderId: string,
    providerOrderId: string,
    expiresAt: Date,
  ): Promise<OrderRecord> {
    const row = await this.prisma.order.update({
      where: { id: orderId },
      data: { providerOrderId, status: 'CREATED', expiresAt },
      select: orderSelect,
    });
    return toOrderRecord(row);
  }

  async markOrderFailed(orderId: string): Promise<OrderRecord> {
    const row = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'FAILED' },
      select: orderSelect,
    });
    return toOrderRecord(row);
  }

  async listOrders(filters: PaymentListFilters): Promise<ListResult<OrderRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.purpose ? { purpose: filters.purpose } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                courseTitleSnapshot: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                planNameSnapshot: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              { receipt: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        select: orderSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items: rows.map(toOrderRecord), total };
  }

  // ── Payments / capture ─────────────────────────────────────────────────

  async findPaymentByProviderPaymentId(
    provider: string,
    providerPaymentId: string,
  ): Promise<PaymentRecord | null> {
    return this.prisma.payment.findUnique({
      where: {
        provider_providerPaymentId: {
          provider: provider as never,
          providerPaymentId,
        },
      },
      select: paymentSelect,
    });
  }

  async findCapturedPaymentForOrder(orderId: string): Promise<PaymentRecord | null> {
    return this.prisma.payment.findFirst({
      where: {
        orderId,
        status: { in: ['CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
      },
      select: paymentSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async capturePayment(data: CapturePaymentData): Promise<CapturePaymentResult> {
    return this.prisma.$transaction(async (tx) => {
      const orderRow = await tx.order.findUnique({
        where: { id: data.orderId },
        select: orderSelect,
      });
      if (!orderRow) {
        throw new PaymentOrderNotFoundException();
      }
      const order = toOrderRecord(orderRow);

      const existing = await tx.payment.findUnique({
        where: {
          provider_providerPaymentId: {
            provider: data.provider as never,
            providerPaymentId: data.providerPaymentId,
          },
        },
        select: paymentSelect,
      });

      // Replayed capture: everything already done — return existing result.
      if (existing?.status === 'CAPTURED' && order.status === 'PAID') {
        return { order, payment: existing, fulfilled: false, alreadyProcessed: true };
      }

      const now = new Date();
      let paymentMethodId: string | undefined;
      if (data.paymentMethod && !existing) {
        const method = await tx.paymentMethod.create({
          data: {
            organizationId: data.organizationId,
            userId: data.customerId,
            provider: data.provider as never,
            type: data.paymentMethod.type,
            displayName: data.paymentMethod.displayName,
            cardNetwork: data.paymentMethod.cardNetwork,
            cardLast4: data.paymentMethod.cardLast4,
            upiHandleMasked: data.paymentMethod.upiHandleMasked,
            bankName: data.paymentMethod.bankName,
            walletName: data.paymentMethod.walletName,
          },
          select: { id: true },
        });
        paymentMethodId = method.id;
      }

      const paymentData = data.captured
        ? { status: 'CAPTURED' as const, capturedAt: now }
        : { status: 'AUTHORIZED' as const, authorizedAt: now };

      const payment = existing
        ? await tx.payment.update({
            where: { id: existing.id },
            data: {
              ...paymentData,
              providerOrderId: data.providerOrderId,
              ...(paymentMethodId ? { paymentMethodId } : {}),
            },
            select: paymentSelect,
          })
        : await tx.payment.create({
            data: {
              organizationId: data.organizationId,
              orderId: data.orderId,
              customerId: data.customerId,
              provider: data.provider as never,
              providerPaymentId: data.providerPaymentId,
              providerOrderId: data.providerOrderId,
              amountMinor: data.amountMinor,
              currency: data.currency,
              paymentMethodId,
              ...paymentData,
            },
            select: paymentSelect,
          });

      if (!data.captured) {
        let updatedOrder = order;
        if (order.status === 'DRAFT' || order.status === 'CREATED') {
          const pendingRow = await tx.order.update({
            where: { id: order.id },
            data: { status: 'PENDING' },
            select: orderSelect,
          });
          updatedOrder = toOrderRecord(pendingRow);
        }
        await tx.auditLog.create({
          data: {
            userId: data.actorUserId,
            action: 'payment.payment.authorized',
            entity: 'Payment',
            entityId: payment.id,
            metadata: {
              organizationId: data.organizationId,
              orderId: data.orderId,
              providerPaymentId: data.providerPaymentId,
              amountMinor: data.amountMinor,
              currency: data.currency,
            },
          },
        });
        return { order: updatedOrder, payment, fulfilled: false, alreadyProcessed: false };
      }

      const orderAlreadyPaid = order.status === 'PAID';
      let fulfilled = false;

      if (!orderAlreadyPaid) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID', paidAt: now },
        });

        // Coupon redemption counts exactly once: on the DRAFT/CREATED -> PAID edge.
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { redemptionCount: { increment: 1 } },
          });
        }

        const invoice = await tx.invoice.findUnique({
          where: { orderId: order.id },
          select: { id: true },
        });
        if (invoice) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID', issuedAt: now, paidAt: now },
          });
        } else {
          await tx.invoice.create({
            data: {
              organizationId: order.organizationId,
              orderId: order.id,
              customerId: order.customerId,
              invoiceNumber: generateInvoiceNumber(),
              status: 'PAID',
              subtotalMinor: order.subtotalMinor,
              discountMinor: order.discountMinor,
              taxMinor: order.taxMinor,
              totalMinor: order.totalMinor,
              currency: order.currency,
              billingAddressSnapshot: {},
              issuedAt: now,
              paidAt: now,
            },
          });
        }

        if (order.purpose === 'COURSE_PURCHASE' && order.courseId && order.batchId) {
          const profile = await tx.studentProfile.findFirst({
            where: {
              organizationId: order.organizationId,
              userId: order.customerId,
              deletedAt: null,
            },
            select: { id: true },
          });
          if (profile) {
            const enrollment = await tx.enrollment.findFirst({
              where: { batchId: order.batchId, studentId: profile.id },
              select: { id: true, status: true },
            });
            if (!enrollment) {
              await tx.enrollment.create({
                data: {
                  organizationId: order.organizationId,
                  courseId: order.courseId,
                  batchId: order.batchId,
                  studentId: profile.id,
                  status: 'ACTIVE',
                },
              });
            } else if (enrollment.status === 'DROPPED') {
              await tx.enrollment.update({
                where: { id: enrollment.id },
                data: { status: 'ACTIVE', completedAt: null },
              });
            }
          }
        } else if (order.purpose === 'ORGANIZATION_SUBSCRIPTION' && order.planId) {
          const existingSubscription = await tx.subscription.findUnique({
            where: { sourceOrderId: order.id },
            select: { id: true },
          });
          if (!existingSubscription) {
            const plan = await tx.plan.findUnique({
              where: { id: order.planId },
              select: planSelect,
            });
            const interval = order.intervalSnapshot ?? plan?.interval ?? 'MONTHLY';
            await tx.subscription.updateMany({
              where: { organizationId: order.organizationId, status: 'ACTIVE' },
              data: {
                status: 'CANCELLED',
                cancelledAt: now,
                endedAt: now,
                cancellationReason: 'Superseded by a new subscription purchase',
              },
            });
            await tx.subscription.create({
              data: {
                organizationId: order.organizationId,
                planId: order.planId,
                sourceOrderId: order.id,
                provider: order.provider as never,
                status: 'ACTIVE',
                planNameSnapshot: order.planNameSnapshot ?? plan?.name ?? 'Plan',
                planTierSnapshot: plan?.tier ?? 'BASIC',
                intervalSnapshot: interval,
                amountMinorSnapshot: order.totalMinor,
                currency: order.currency,
                currentPeriodStart: now,
                currentPeriodEnd: addBillingInterval(now, interval),
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            userId: data.actorUserId,
            action: 'payment.payment.captured',
            entity: 'Order',
            entityId: order.id,
            metadata: {
              organizationId: data.organizationId,
              orderId: order.id,
              paymentId: payment.id,
              providerPaymentId: data.providerPaymentId,
              amountMinor: data.amountMinor,
              currency: data.currency,
              purpose: order.purpose,
              ...(data.paymentEventId ? { paymentEventId: data.paymentEventId } : {}),
            },
          },
        });

        fulfilled = true;
      }

      const refreshedRow = await tx.order.findUnique({
        where: { id: order.id },
        select: orderSelect,
      });
      return {
        order: refreshedRow ? toOrderRecord(refreshedRow) : order,
        payment,
        fulfilled,
        alreadyProcessed: false,
      };
    });
  }

  async recordPaymentFailure(data: RecordPaymentFailureData): Promise<PaymentRecord> {
    return this.prisma.$transaction(async (tx) => {
      const failureFields = {
        status: 'FAILED' as const,
        failureCode: data.failureCode,
        failureDescription: data.failureDescription,
        failureSource: data.failureSource,
        failureStep: data.failureStep,
        failureReason: data.failureReason,
      };

      let payment: PaymentRecord | null = null;
      if (data.providerPaymentId) {
        payment = await tx.payment.findUnique({
          where: {
            provider_providerPaymentId: {
              provider: data.provider as never,
              providerPaymentId: data.providerPaymentId,
            },
          },
          select: paymentSelect,
        });
      }

      if (payment?.status === 'CAPTURED') {
        // Never regress a captured payment from a late/failed duplicate event.
        return payment;
      }

      payment = payment
        ? await tx.payment.update({
            where: { id: payment.id },
            data: failureFields,
            select: paymentSelect,
          })
        : await tx.payment.create({
            data: {
              organizationId: data.organizationId,
              orderId: data.orderId,
              customerId: data.customerId,
              provider: data.provider as never,
              providerPaymentId: data.providerPaymentId,
              providerOrderId: data.providerOrderId,
              amountMinor: data.amountMinor,
              currency: data.currency,
              ...failureFields,
            },
            select: paymentSelect,
          });

      await tx.order.updateMany({
        where: {
          id: data.orderId,
          status: { in: ['DRAFT', 'CREATED', 'PENDING'] },
        },
        data: { status: 'FAILED' },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'payment.payment.failed',
          entity: 'Payment',
          entityId: payment.id,
          metadata: {
            organizationId: data.organizationId,
            orderId: data.orderId,
            providerPaymentId: data.providerPaymentId,
            failureCode: data.failureCode ?? null,
            failureReason: data.failureReason ?? null,
          },
        },
      });

      return payment;
    });
  }

  // ── Invoices ───────────────────────────────────────────────────────────

  async listInvoices(filters: PaymentListFilters): Promise<ListResult<InvoiceRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                invoiceNumber: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                customer: {
                  email: { contains: filters.search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const sortBy = filters.sortBy === 'status' ? 'status' : filters.sortBy;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        select: invoiceSelect,
        orderBy: { [sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items: rows.map(toInvoiceRecord), total };
  }

  async findInvoiceById(id: string): Promise<InvoiceRecord | null> {
    const row = await this.prisma.invoice.findUnique({
      where: { id },
      select: invoiceSelect,
    });
    return row ? toInvoiceRecord(row) : null;
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  async findCurrentSubscription(organizationId: string): Promise<SubscriptionRecord | null> {
    return this.prisma.subscription.findFirst({
      where: { organizationId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      select: subscriptionSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSubscriptions(filters: PaymentListFilters): Promise<ListResult<SubscriptionRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.search
        ? {
            planNameSnapshot: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const sortBy = filters.sortBy === 'totalMinor' ? 'amountMinorSnapshot' : filters.sortBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        select: subscriptionSelect,
        orderBy: { [sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { items, total };
  }

  async assignSubscription(data: AssignSubscriptionData): Promise<SubscriptionRecord> {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({
        where: { id: data.planId },
        select: planSelect,
      });
      if (plan?.organizationId !== data.organizationId) {
        // Service validates first; guard against races.
        throw new PaymentOrderNotFoundException('Plan not found.');
      }

      const now = new Date();
      await tx.subscription.updateMany({
        where: { organizationId: data.organizationId, status: 'ACTIVE' },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledById: data.actorUserId,
          endedAt: now,
          cancellationReason: 'Replaced by an admin plan assignment',
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          organizationId: data.organizationId,
          planId: plan.id,
          createdById: data.actorUserId,
          provider: 'MANUAL',
          status: 'ACTIVE',
          planNameSnapshot: plan.name,
          planTierSnapshot: plan.tier,
          intervalSnapshot: plan.interval,
          amountMinorSnapshot: plan.amountMinor,
          currency: plan.currency,
          currentPeriodStart: data.periodStart,
          currentPeriodEnd: data.periodEnd,
          trialEndsAt: data.trialEndsAt,
        },
        select: subscriptionSelect,
      });

      await tx.auditLog.create({
        data: {
          userId: data.actorUserId,
          action: 'payment.subscription.assign',
          entity: 'Subscription',
          entityId: subscription.id,
          metadata: {
            organizationId: data.organizationId,
            planId: plan.id,
            planTier: plan.tier,
            interval: plan.interval,
            amountMinor: plan.amountMinor,
            periodStart: data.periodStart.toISOString(),
            periodEnd: data.periodEnd.toISOString(),
            ...(data.note ? { note: data.note } : {}),
          },
        },
      });

      return subscription;
    });
  }

  // ── Plans ──────────────────────────────────────────────────────────────

  async listPlans(filters: PaymentListFilters): Promise<ListResult<PlanRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' as const } },
              {
                description: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const sortBy = filters.sortBy === 'totalMinor' ? 'amountMinor' : filters.sortBy;
    const orderBy =
      sortBy === 'status' ? { isActive: filters.sortOrder } : { [sortBy]: filters.sortOrder };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({
        where,
        select: planSelect,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return { items, total };
  }

  async findPlanById(organizationId: string, planId: string): Promise<PlanRecord | null> {
    return this.prisma.plan.findFirst({
      where: { id: planId, organizationId },
      select: planSelect,
    });
  }

  async createPlan(data: CreatePlanData): Promise<PlanRecord> {
    const plan = await this.prisma.plan.create({
      data: {
        organizationId: data.organizationId,
        createdById: data.createdById,
        tier: data.tier,
        name: data.name,
        description: data.description,
        interval: data.interval,
        amountMinor: data.amountMinor,
        currency: data.currency,
        trialDays: data.trialDays ?? 0,
        features: (data.features ?? undefined) as never,
        isActive: data.isActive ?? true,
      },
      select: planSelect,
    });

    await this.audit({
      userId: data.createdById,
      action: 'payment.plan.create',
      entity: 'Plan',
      entityId: plan.id,
      metadata: {
        organizationId: data.organizationId,
        tier: data.tier,
        interval: data.interval,
        amountMinor: data.amountMinor,
        currency: data.currency,
      },
    });

    return plan;
  }

  async updatePlan(planId: string, data: UpdatePlanData): Promise<PlanRecord> {
    return this.prisma.plan.update({
      where: { id: planId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.amountMinor !== undefined ? { amountMinor: data.amountMinor } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.interval !== undefined ? { interval: data.interval } : {}),
        ...(data.tier !== undefined ? { tier: data.tier } : {}),
        ...(data.trialDays !== undefined ? { trialDays: data.trialDays } : {}),
        ...(data.features !== undefined ? { features: data.features as never } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: planSelect,
    });
  }

  // ── Coupons ────────────────────────────────────────────────────────────

  async findCouponByCode(organizationId: string, code: string): Promise<CouponRecord | null> {
    return this.prisma.coupon.findUnique({
      where: { organizationId_code: { organizationId, code } },
      select: couponSelect,
    });
  }

  async findCouponById(couponId: string): Promise<CouponRecord | null> {
    return this.prisma.coupon.findUnique({
      where: { id: couponId },
      select: couponSelect,
    });
  }

  async listCoupons(filters: PaymentListFilters): Promise<ListResult<CouponRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' as const } },
              { name: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const sortBy =
      filters.sortBy === 'totalMinor' || filters.sortBy === 'status' ? 'createdAt' : filters.sortBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({
        where,
        select: couponSelect,
        orderBy: { [sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return { items, total };
  }

  async createCoupon(data: CreateCouponData): Promise<CouponRecord> {
    const coupon = await this.prisma.coupon.create({
      data: {
        organizationId: data.organizationId,
        createdById: data.createdById,
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        amountOffMinor: data.amountOffMinor,
        percentOffBps: data.percentOffBps,
        currency: data.currency,
        minimumOrderMinor: data.minimumOrderMinor,
        maximumDiscountMinor: data.maximumDiscountMinor,
        maxRedemptions: data.maxRedemptions,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        isActive: data.isActive ?? true,
      },
      select: couponSelect,
    });

    await this.audit({
      userId: data.createdById,
      action: 'payment.coupon.create',
      entity: 'Coupon',
      entityId: coupon.id,
      metadata: {
        organizationId: data.organizationId,
        code: data.code,
        type: data.type,
      },
    });

    return coupon;
  }

  async updateCoupon(couponId: string, data: UpdateCouponData): Promise<CouponRecord> {
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.amountOffMinor !== undefined ? { amountOffMinor: data.amountOffMinor } : {}),
        ...(data.percentOffBps !== undefined ? { percentOffBps: data.percentOffBps } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.minimumOrderMinor !== undefined
          ? { minimumOrderMinor: data.minimumOrderMinor }
          : {}),
        ...(data.maximumDiscountMinor !== undefined
          ? { maximumDiscountMinor: data.maximumDiscountMinor }
          : {}),
        ...(data.maxRedemptions !== undefined ? { maxRedemptions: data.maxRedemptions } : {}),
        ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: couponSelect,
    });
  }

  // ── Refunds ────────────────────────────────────────────────────────────

  async findRefundByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<RefundRecord | null> {
    return this.prisma.refund.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId, idempotencyKey },
      },
      select: refundSelect,
    });
  }

  async findRefundByProviderRefundId(
    provider: string,
    providerRefundId: string,
  ): Promise<RefundRecord | null> {
    return this.prisma.refund.findUnique({
      where: {
        provider_providerRefundId: {
          provider: provider as never,
          providerRefundId,
        },
      },
      select: refundSelect,
    });
  }

  async findRefundById(refundId: string): Promise<RefundRecord | null> {
    return this.prisma.refund.findUnique({
      where: { id: refundId },
      select: refundSelect,
    });
  }

  async sumReservedRefundsMinor(paymentId: string): Promise<number> {
    const result = await this.prisma.refund.aggregate({
      where: { paymentId, status: { in: [...REFUND_RESERVING_STATUSES] as never[] } },
      _sum: { amountMinor: true },
    });
    return result._sum.amountMinor ?? 0;
  }

  async createRefund(data: CreateRefundData): Promise<RefundRecord> {
    const refund = await this.prisma.refund.create({
      data: {
        organizationId: data.organizationId,
        paymentId: data.paymentId,
        orderId: data.orderId,
        requestedById: data.requestedById,
        provider: data.provider as never,
        idempotencyKey: data.idempotencyKey,
        amountMinor: data.amountMinor,
        currency: data.currency,
        status: 'PENDING',
        reason: data.reason,
      },
      select: refundSelect,
    });

    await this.audit({
      userId: data.requestedById,
      action: 'payment.refund.request',
      entity: 'Refund',
      entityId: refund.id,
      metadata: {
        organizationId: data.organizationId,
        orderId: data.orderId,
        paymentId: data.paymentId,
        amountMinor: data.amountMinor,
        currency: data.currency,
        ...(data.reason ? { reason: data.reason } : {}),
      },
    });

    return refund;
  }

  async finalizeRefund(data: FinalizeRefundData): Promise<RefundRecord> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.refund.findUnique({
        where: { id: data.refundId },
        select: refundSelect,
      });
      if (!current) {
        throw new PaymentOrderNotFoundException('Refund not found.');
      }

      // Replay-safe: a refund already in the target terminal state is a no-op.
      if (current.status === data.status) {
        return current;
      }
      const alreadyCounted = current.status === 'PROCESSED' && data.status !== 'PROCESSED';
      if (alreadyCounted) {
        return current;
      }

      const refund = await tx.refund.update({
        where: { id: data.refundId },
        data: {
          status: data.status,
          ...(data.providerRefundId ? { providerRefundId: data.providerRefundId } : {}),
          ...(data.processedAt ? { processedAt: data.processedAt } : {}),
          ...(data.failureCode !== undefined ? { failureCode: data.failureCode } : {}),
          ...(data.failureReason !== undefined ? { failureReason: data.failureReason } : {}),
        },
        select: refundSelect,
      });

      if (data.status === 'PROCESSED') {
        const payment = await tx.payment.findUnique({
          where: { id: refund.paymentId },
          select: paymentSelect,
        });
        if (payment) {
          const refundedMinor = payment.refundedMinor + refund.amountMinor;
          const paymentStatus =
            refundedMinor >= payment.amountMinor ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
          await tx.payment.update({
            where: { id: payment.id },
            data: { refundedMinor, status: paymentStatus },
          });
          await tx.order.update({
            where: { id: refund.orderId },
            data: {
              status: refundedMinor >= payment.amountMinor ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: data.actorUserId,
          action:
            data.status === 'PROCESSED'
              ? 'payment.refund.processed'
              : data.status === 'FAILED'
                ? 'payment.refund.failed'
                : 'payment.refund.update',
          entity: 'Refund',
          entityId: refund.id,
          metadata: {
            organizationId: refund.organizationId,
            orderId: refund.orderId,
            paymentId: refund.paymentId,
            amountMinor: refund.amountMinor,
            status: data.status,
            ...(data.failureReason ? { failureReason: data.failureReason } : {}),
          },
        },
      });

      return refund;
    });
  }

  async listRefunds(filters: PaymentListFilters): Promise<ListResult<RefundRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.search
        ? {
            OR: [
              { reason: { contains: filters.search, mode: 'insensitive' as const } },
              {
                providerRefundId: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const sortBy = filters.sortBy === 'totalMinor' ? 'amountMinor' : filters.sortBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        where,
        select: refundSelect,
        orderBy: { [sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { items, total };
  }

  // ── Transactions & overview ────────────────────────────────────────────

  async listTransactions(filters: PaymentListFilters): Promise<ListResult<TransactionRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.purpose ? { purpose: filters.purpose } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                customer: {
                  OR: [
                    {
                      email: {
                        contains: filters.search,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      firstName: {
                        contains: filters.search,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      lastName: {
                        contains: filters.search,
                        mode: 'insensitive' as const,
                      },
                    },
                  ],
                },
              },
              { receipt: { contains: filters.search, mode: 'insensitive' as const } },
              {
                courseTitleSnapshot: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                planNameSnapshot: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        select: {
          ...orderSelect,
          customer: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          payments: {
            select: paymentSelect,
            orderBy: { createdAt: 'desc' as const },
            take: 1,
          },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const items: TransactionRecord[] = rows.map((row) => {
      const { customer, payments, ...orderRow } = row;
      return {
        order: toOrderRecord(orderRow),
        latestPayment: payments[0] ?? null,
        customer,
      };
    });

    return { items, total };
  }

  async getOverview(organizationId: string, monthStart: Date): Promise<PaymentOverviewRecord> {
    const paidStatuses = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const;

    const [
      revenueTotal,
      revenueMonth,
      successfulPayments,
      failedPayments,
      pendingPayments,
      activeSubscriptions,
      openRefunds,
      issuedInvoices,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        where: { organizationId, status: { in: [...paidStatuses] } },
        _sum: { totalMinor: true },
      }),
      this.prisma.order.aggregate({
        where: {
          organizationId,
          status: { in: [...paidStatuses] },
          paidAt: { gte: monthStart },
        },
        _sum: { totalMinor: true },
      }),
      this.prisma.payment.count({
        where: {
          organizationId,
          status: { in: ['CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
        },
      }),
      this.prisma.payment.count({ where: { organizationId, status: 'FAILED' } }),
      this.prisma.payment.count({
        where: {
          organizationId,
          status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] },
        },
      }),
      this.prisma.subscription.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.refund.count({
        where: { organizationId, status: { in: ['PENDING', 'PROCESSING'] } },
      }),
      this.prisma.invoice.count({
        where: { organizationId, issuedAt: { not: null } },
      }),
    ]);

    return {
      revenueTotalMinor: revenueTotal._sum.totalMinor ?? 0,
      revenueMonthMinor: revenueMonth._sum.totalMinor ?? 0,
      successfulPayments,
      failedPayments,
      pendingPayments,
      activeSubscriptions,
      openRefunds,
      issuedInvoices,
    };
  }

  // ── Webhook events ─────────────────────────────────────────────────────

  async createPaymentEvent(
    data: CreatePaymentEventData,
  ): Promise<{ created: boolean; event: PaymentEventRecord }> {
    try {
      const event = await this.prisma.paymentEvent.create({
        data: {
          provider: data.provider as never,
          eventId: data.eventId,
          type: data.type,
          status: 'PENDING',
          payload: data.payload as never,
          signatureHash: data.signatureHash,
          organizationId: data.organizationId,
        },
        select: paymentEventSelect,
      });
      return { created: true, event };
    } catch (error: unknown) {
      if (!isPrismaUniqueConflict(error)) {
        throw error;
      }
      const event = await this.prisma.paymentEvent.findUnique({
        where: {
          provider_eventId: {
            provider: data.provider as never,
            eventId: data.eventId,
          },
        },
        select: paymentEventSelect,
      });
      if (!event) {
        throw error;
      }
      return { created: false, event };
    }
  }

  async updatePaymentEvent(eventId: string, data: UpdatePaymentEventData): Promise<void> {
    await this.prisma.paymentEvent.update({
      where: { id: eventId },
      data: {
        status: data.status,
        attempts: { increment: 1 },
        ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
        ...(data.processedAt ? { processedAt: data.processedAt } : {}),
        ...(data.organizationId ? { organizationId: data.organizationId } : {}),
        ...(data.orderId ? { orderId: data.orderId } : {}),
        ...(data.paymentId ? { paymentId: data.paymentId } : {}),
        ...(data.refundId ? { refundId: data.refundId } : {}),
        ...(data.subscriptionId ? { subscriptionId: data.subscriptionId } : {}),
      },
    });
  }

  // ── Audit ──────────────────────────────────────────────────────────────

  async audit(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata as never,
      },
    });
  }
}
