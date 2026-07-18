import type {
  AdminPaymentOverviewResponseDto,
  CatalogCourseResponseDto,
  CatalogPlanResponseDto,
  CouponResponseDto,
  InvoiceResponseDto,
  OrderLineResponseDto,
  OrderResponseDto,
  PaymentCatalogResponseDto,
  PaymentHistoryItemResponseDto,
  PlanResponseDto,
  RefundResponseDto,
  SubscriptionResponseDto,
  TransactionResponseDto,
} from '../dto/payment-response.dto';
import type {
  CatalogCourseRecord,
  CouponRecord,
  InvoiceRecord,
  OrderRecord,
  PaymentOverviewRecord,
  PlanRecord,
  RefundRecord,
  SubscriptionRecord,
  TransactionRecord,
} from '../interfaces/payments-repository.interface';

function iso(value: Date): string {
  return value.toISOString();
}

function isoOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/** Human-readable order description built from immutable snapshots. */
function describeOrder(order: {
  purpose: string;
  courseTitleSnapshot: string | null;
  batchNameSnapshot: string | null;
  planNameSnapshot: string | null;
}): string {
  if (order.purpose === 'COURSE_PURCHASE') {
    const title = order.courseTitleSnapshot ?? 'Course';
    return order.batchNameSnapshot ? `${title} — ${order.batchNameSnapshot}` : title;
  }
  return order.planNameSnapshot ? `${order.planNameSnapshot} subscription` : 'Subscription';
}

function orderLines(order: OrderRecord): OrderLineResponseDto[] {
  const lines: OrderLineResponseDto[] = [
    {
      label: describeOrder(order),
      amountMinor: order.subtotalMinor,
      currency: order.currency,
    },
  ];
  if (order.discountMinor > 0) {
    lines.push({
      label: order.couponCode ? `Discount (${order.couponCode})` : 'Discount',
      amountMinor: -order.discountMinor,
      currency: order.currency,
    });
  }
  if (order.taxMinor > 0) {
    lines.push({ label: 'Tax', amountMinor: order.taxMinor, currency: order.currency });
  }
  return lines;
}

/** Converts Plan.features Json into display strings without leaking structure. */
export function planFeatureList(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (features !== null && typeof features === 'object') {
    return Object.entries(features as Record<string, unknown>)
      .filter(([, value]) => value !== null && value !== undefined && value !== false)
      .map(([key, value]) => {
        const label = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
        return value === true ? label : `${label}: ${String(value)}`;
      });
  }
  return [];
}

export class PaymentsMapper {
  static toOrderResponse(order: OrderRecord, checkoutPublicKey: string | null): OrderResponseDto {
    return {
      id: order.id,
      organizationId: order.organizationId,
      purpose: order.purpose,
      status: order.status,
      currency: order.currency,
      subtotalMinor: order.subtotalMinor,
      discountMinor: order.discountMinor,
      taxMinor: order.taxMinor,
      totalMinor: order.totalMinor,
      lines: orderLines(order),
      courseId: order.courseId,
      batchId: order.batchId,
      planId: order.planId,
      couponCode: order.couponCode,
      providerOrderId: order.providerOrderId,
      checkoutPublicKey,
      receiptNumber: order.receipt,
      createdAt: iso(order.createdAt),
      updatedAt: iso(order.updatedAt),
      paidAt: isoOrNull(order.paidAt),
    };
  }

  static toOrderResponseList(
    orders: OrderRecord[],
    checkoutPublicKey: string | null,
  ): OrderResponseDto[] {
    return orders.map((order) => PaymentsMapper.toOrderResponse(order, checkoutPublicKey));
  }

  static toHistoryItem(order: OrderRecord): PaymentHistoryItemResponseDto {
    return {
      id: order.id,
      orderId: order.id,
      purpose: order.purpose,
      status: order.status,
      description: describeOrder(order),
      totalMinor: order.totalMinor,
      currency: order.currency,
      createdAt: iso(order.createdAt),
      paidAt: isoOrNull(order.paidAt),
    };
  }

  static toInvoiceResponse(invoice: InvoiceRecord): InvoiceResponseDto {
    return {
      id: invoice.id,
      organizationId: invoice.organizationId,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      subtotalMinor: invoice.subtotalMinor,
      discountMinor: invoice.discountMinor,
      taxMinor: invoice.taxMinor,
      totalMinor: invoice.totalMinor,
      lines: [
        {
          label: describeOrder({
            purpose: invoice.orderPurpose ?? 'COURSE_PURCHASE',
            courseTitleSnapshot: invoice.courseTitleSnapshot,
            batchNameSnapshot: invoice.batchNameSnapshot,
            planNameSnapshot: invoice.planNameSnapshot,
          }),
          amountMinor: invoice.subtotalMinor,
          currency: invoice.currency,
        },
        ...(invoice.discountMinor > 0
          ? [
              {
                label: 'Discount',
                amountMinor: -invoice.discountMinor,
                currency: invoice.currency,
              },
            ]
          : []),
        ...(invoice.taxMinor > 0
          ? [{ label: 'Tax', amountMinor: invoice.taxMinor, currency: invoice.currency }]
          : []),
      ],
      billedToName: invoice.customerName,
      billedToEmail: invoice.customerEmail,
      issuedAt: isoOrNull(invoice.issuedAt),
      paidAt: isoOrNull(invoice.paidAt),
      createdAt: iso(invoice.createdAt),
    };
  }

  static toInvoiceResponseList(invoices: InvoiceRecord[]): InvoiceResponseDto[] {
    return invoices.map((invoice) => PaymentsMapper.toInvoiceResponse(invoice));
  }

  static toSubscriptionResponse(subscription: SubscriptionRecord): SubscriptionResponseDto {
    const active = subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE';
    const topTier = subscription.planTierSnapshot === 'ENTERPRISE';
    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      planName: subscription.planNameSnapshot,
      planTier: subscription.planTierSnapshot,
      status: subscription.status,
      priceMinor: subscription.amountMinorSnapshot,
      currency: subscription.currency,
      interval: subscription.intervalSnapshot,
      currentPeriodStart: isoOrNull(subscription.currentPeriodStart),
      currentPeriodEnd: isoOrNull(subscription.currentPeriodEnd),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canRenew: active,
      canUpgrade: active && !topTier,
      renewMessage: active
        ? null
        : 'This subscription is not active. Assign or purchase a plan to renew.',
      upgradeMessage: topTier ? 'Already on the highest tier.' : null,
      createdAt: iso(subscription.createdAt),
      updatedAt: iso(subscription.updatedAt),
    };
  }

  static toSubscriptionResponseList(
    subscriptions: SubscriptionRecord[],
  ): SubscriptionResponseDto[] {
    return subscriptions.map((item) => PaymentsMapper.toSubscriptionResponse(item));
  }

  static toPlanResponse(plan: PlanRecord): PlanResponseDto {
    return {
      id: plan.id,
      organizationId: plan.organizationId,
      name: plan.name,
      description: plan.description,
      tier: plan.tier,
      priceMinor: plan.amountMinor,
      currency: plan.currency,
      interval: plan.interval,
      trialDays: plan.trialDays,
      features: planFeatureList(plan.features),
      isActive: plan.isActive,
      sortOrder: 0,
      createdAt: iso(plan.createdAt),
      updatedAt: iso(plan.updatedAt),
    };
  }

  static toPlanResponseList(plans: PlanRecord[]): PlanResponseDto[] {
    return plans.map((plan) => PaymentsMapper.toPlanResponse(plan));
  }

  static toCatalogResponse(
    courses: CatalogCourseRecord[],
    plans: PlanRecord[],
    currency: string,
  ): PaymentCatalogResponseDto {
    const catalogCourses: CatalogCourseResponseDto[] = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      priceMinor: course.priceMinor,
      currency: course.currency,
      batches: course.batches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        courseId: batch.courseId,
      })),
    }));

    const catalogPlans: CatalogPlanResponseDto[] = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMinor: plan.amountMinor,
      currency: plan.currency,
      interval: plan.interval,
      features: planFeatureList(plan.features),
      isActive: plan.isActive,
    }));

    return { courses: catalogCourses, plans: catalogPlans, currency };
  }

  static toTransactionResponse(record: TransactionRecord): TransactionResponseDto {
    const { order, latestPayment, customer } = record;
    const status = latestPayment?.status ?? order.status;
    return {
      id: order.id,
      orderId: order.id,
      organizationId: order.organizationId,
      purpose: order.purpose,
      status,
      description: describeOrder(order),
      totalMinor: order.totalMinor,
      currency: order.currency,
      provider: order.provider,
      providerOrderId: order.providerOrderId,
      providerPaymentId: latestPayment?.providerPaymentId ?? null,
      userId: customer?.id ?? order.customerId,
      userEmail: customer?.email ?? null,
      userName: customer ? `${customer.firstName} ${customer.lastName}`.trim() || null : null,
      failureReason: latestPayment?.failureReason ?? null,
      canRetry: order.status === 'FAILED' || order.status === 'EXPIRED',
      createdAt: iso(order.createdAt),
      paidAt: isoOrNull(order.paidAt),
      updatedAt: iso(order.updatedAt),
    };
  }

  static toTransactionResponseList(records: TransactionRecord[]): TransactionResponseDto[] {
    return records.map((record) => PaymentsMapper.toTransactionResponse(record));
  }

  static toRefundResponse(refund: RefundRecord): RefundResponseDto {
    return {
      id: refund.id,
      organizationId: refund.organizationId,
      orderId: refund.orderId,
      transactionId: refund.paymentId,
      status: refund.status,
      amountMinor: refund.amountMinor,
      currency: refund.currency,
      reason: refund.reason,
      createdAt: iso(refund.createdAt),
      processedAt: isoOrNull(refund.processedAt),
    };
  }

  static toRefundResponseList(refunds: RefundRecord[]): RefundResponseDto[] {
    return refunds.map((refund) => PaymentsMapper.toRefundResponse(refund));
  }

  static toCouponResponse(coupon: CouponRecord): CouponResponseDto {
    const isPercent = coupon.type === 'PERCENTAGE';
    return {
      id: coupon.id,
      organizationId: coupon.organizationId,
      code: coupon.code,
      description: coupon.description ?? coupon.name,
      discountType: isPercent ? 'percent' : 'fixed',
      discountValue: isPercent
        ? Math.round((coupon.percentOffBps ?? 0) / 100)
        : (coupon.amountOffMinor ?? 0),
      currency: coupon.currency,
      maxRedemptions: coupon.maxRedemptions,
      redemptionCount: coupon.redemptionCount,
      isActive: coupon.isActive,
      startsAt: isoOrNull(coupon.startsAt),
      endsAt: isoOrNull(coupon.expiresAt),
      createdAt: iso(coupon.createdAt),
      updatedAt: iso(coupon.updatedAt),
    };
  }

  static toCouponResponseList(coupons: CouponRecord[]): CouponResponseDto[] {
    return coupons.map((coupon) => PaymentsMapper.toCouponResponse(coupon));
  }

  static toOverviewResponse(
    organizationId: string,
    currency: string,
    overview: PaymentOverviewRecord,
  ): AdminPaymentOverviewResponseDto {
    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      currency,
      revenueTotalMinor: overview.revenueTotalMinor,
      revenueMonthMinor: overview.revenueMonthMinor,
      successfulPayments: overview.successfulPayments,
      failedPayments: overview.failedPayments,
      pendingPayments: overview.pendingPayments,
      activeSubscriptions: overview.activeSubscriptions,
      openRefunds: overview.openRefunds,
      issuedInvoices: overview.issuedInvoices,
    };
  }
}
