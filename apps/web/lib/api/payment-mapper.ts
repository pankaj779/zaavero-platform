import { formatMoneyMinorUnits } from '../payments/money';
import type {
  AdminPaymentOverviewDto,
  CatalogBatchDto,
  CatalogCourseDto,
  CatalogPlanDto,
  CouponDiscountType,
  CouponDto,
  InvoiceDto,
  InvoiceStatus,
  MoneyDisplayDto,
  OrderSummaryLineDto,
  PaymentCatalogDto,
  PaymentConfigDto,
  PaymentHistoryItemDto,
  PaymentListMetaDto,
  PaymentOrderDto,
  PaymentOrderStatus,
  PaymentPurpose,
  PlanDto,
  PlanInterval,
  RefundDto,
  RefundStatus,
  SubscriptionDto,
  SubscriptionStatus,
  TransactionDto,
} from '../payments/payment-types';

/** Raw payment config from NestJS Payments API. */
export interface PaymentConfigApiRecord {
  configured: boolean;
  provider?: string | null;
  publicKey?: string | null;
  keyId?: string | null;
  currency?: string | null;
  message?: string | null;
}

export interface MoneyApiRecord {
  amountMinor?: number | null;
  amount?: number | null;
  currency?: string | null;
}

export interface OrderLineApiRecord {
  label?: string | null;
  description?: string | null;
  amountMinor?: number | null;
  amount?: number | null;
  currency?: string | null;
}

export interface PaymentOrderApiRecord {
  id: string;
  organizationId: string;
  purpose: string;
  status: string;
  currency?: string | null;
  subtotalMinor?: number | null;
  discountMinor?: number | null;
  taxMinor?: number | null;
  totalMinor?: number | null;
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  total?: number | null;
  lines?: OrderLineApiRecord[] | null;
  courseId?: string | null;
  batchId?: string | null;
  planId?: string | null;
  couponCode?: string | null;
  providerOrderId?: string | null;
  checkoutPublicKey?: string | null;
  keyId?: string | null;
  receiptNumber?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
}

export interface PaymentHistoryApiRecord {
  id: string;
  orderId?: string | null;
  purpose?: string | null;
  status: string;
  description?: string | null;
  title?: string | null;
  totalMinor?: number | null;
  total?: number | null;
  currency?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface InvoiceApiRecord {
  id: string;
  organizationId: string;
  orderId?: string | null;
  invoiceNumber: string;
  status: string;
  currency?: string | null;
  subtotalMinor?: number | null;
  discountMinor?: number | null;
  taxMinor?: number | null;
  totalMinor?: number | null;
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  total?: number | null;
  lines?: OrderLineApiRecord[] | null;
  billedToName?: string | null;
  billedToEmail?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface SubscriptionApiRecord {
  id: string;
  organizationId: string;
  planId: string;
  planName?: string | null;
  plan?: { id?: string; name?: string | null } | null;
  status: string;
  priceMinor?: number | null;
  price?: number | null;
  currency?: string | null;
  interval?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  canRenew?: boolean | null;
  canUpgrade?: boolean | null;
  renewMessage?: string | null;
  upgradeMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogBatchApiRecord {
  id: string;
  name: string;
  courseId?: string | null;
}

export interface CatalogCourseApiRecord {
  id: string;
  title: string;
  description?: string | null;
  priceMinor?: number | null;
  price?: number | null;
  currency?: string | null;
  batches?: CatalogBatchApiRecord[] | null;
}

export interface CatalogPlanApiRecord {
  id: string;
  name: string;
  description?: string | null;
  priceMinor?: number | null;
  price?: number | null;
  currency?: string | null;
  interval?: string | null;
  features?: string[] | null;
  isActive?: boolean | null;
}

export interface PaymentCatalogApiRecord {
  courses?: CatalogCourseApiRecord[] | null;
  plans?: CatalogPlanApiRecord[] | null;
  currency?: string | null;
}

export interface AdminOverviewApiRecord {
  organizationId: string;
  generatedAt?: string | null;
  currency?: string | null;
  revenueTotalMinor?: number | null;
  revenueMonthMinor?: number | null;
  revenueTotal?: number | null;
  revenueMonth?: number | null;
  successfulPayments?: number | null;
  failedPayments?: number | null;
  pendingPayments?: number | null;
  activeSubscriptions?: number | null;
  openRefunds?: number | null;
  issuedInvoices?: number | null;
}

export interface PlanApiRecord {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  priceMinor?: number | null;
  price?: number | null;
  currency?: string | null;
  interval?: string | null;
  features?: string[] | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionApiRecord {
  id: string;
  orderId: string;
  organizationId: string;
  purpose?: string | null;
  status: string;
  description?: string | null;
  totalMinor?: number | null;
  total?: number | null;
  currency?: string | null;
  provider?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  user?: {
    id?: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  failureReason?: string | null;
  canRetry?: boolean | null;
  createdAt: string;
  paidAt?: string | null;
  updatedAt: string;
}

export interface RefundApiRecord {
  id: string;
  organizationId: string;
  orderId: string;
  transactionId?: string | null;
  status: string;
  amountMinor?: number | null;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface CouponApiRecord {
  id: string;
  organizationId: string;
  code: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  currency?: string | null;
  maxRedemptions?: number | null;
  redemptionCount?: number | null;
  isActive?: boolean | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function asIntegerMinor(value: number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  return fallback;
}

function resolveMinor(
  primary: number | null | undefined,
  secondary: number | null | undefined,
  fallback = 0,
): number {
  if (typeof primary === 'number' && Number.isFinite(primary)) {
    return Math.trunc(primary);
  }
  if (typeof secondary === 'number' && Number.isFinite(secondary)) {
    return Math.trunc(secondary);
  }
  return fallback;
}

export function mapMoneyDisplay(
  amountMinor: number,
  currency: string | null | undefined,
  locale = 'en-IN',
): MoneyDisplayDto {
  const currencyCode = (currency ?? 'INR').trim().toUpperCase() || 'INR';
  const minor = asIntegerMinor(amountMinor);
  return {
    amountMinor: minor,
    currency: currencyCode,
    formatted: formatMoneyMinorUnits(minor, currencyCode, locale),
  };
}

function mapMoneyFromRecord(
  record: MoneyApiRecord | null | undefined,
  fallbackCurrency: string,
): MoneyDisplayDto {
  return mapMoneyDisplay(
    resolveMinor(record?.amountMinor, record?.amount),
    record?.currency ?? fallbackCurrency,
  );
}

export function mapPaymentPurpose(value: string | null | undefined): PaymentPurpose {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'ORGANIZATION_SUBSCRIPTION') {
    return 'ORGANIZATION_SUBSCRIPTION';
  }
  return 'COURSE_PURCHASE';
}

export function mapPaymentOrderStatus(value: string | null | undefined): PaymentOrderStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'PENDING':
      return 'pending';
    case 'PAID':
    case 'CAPTURED':
    case 'SUCCESS':
      return 'paid';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled';
    case 'REFUNDED':
      return 'refunded';
    case 'PARTIALLY_REFUNDED':
      return 'partially_refunded';
    case 'EXPIRED':
      return 'expired';
    case 'CREATED':
    default:
      return 'created';
  }
}

export function mapInvoiceStatus(value: string | null | undefined): InvoiceStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'ISSUED':
      return 'issued';
    case 'PAID':
      return 'paid';
    case 'VOID':
      return 'void';
    case 'REFUNDED':
      return 'refunded';
    case 'DRAFT':
    default:
      return 'draft';
  }
}

export function mapSubscriptionStatus(value: string | null | undefined): SubscriptionStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'TRIALING':
      return 'trialing';
    case 'PAST_DUE':
      return 'past_due';
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled';
    case 'EXPIRED':
      return 'expired';
    case 'INCOMPLETE':
      return 'incomplete';
    case 'ACTIVE':
    default:
      return 'active';
  }
}

export function mapPlanInterval(value: string | null | undefined): PlanInterval {
  switch ((value ?? '').toUpperCase()) {
    case 'YEARLY':
    case 'YEAR':
    case 'ANNUAL':
      return 'yearly';
    case 'LIFETIME':
      return 'lifetime';
    case 'CUSTOM':
      return 'custom';
    case 'MONTHLY':
    case 'MONTH':
    default:
      return 'monthly';
  }
}

export function mapCouponDiscountType(value: string | null | undefined): CouponDiscountType {
  switch ((value ?? '').toUpperCase()) {
    case 'FIXED':
    case 'FLAT':
    case 'AMOUNT':
      return 'fixed';
    case 'PERCENT':
    case 'PERCENTAGE':
    default:
      return 'percent';
  }
}

export function mapRefundStatus(value: string | null | undefined): RefundStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'PROCESSED':
    case 'COMPLETED':
      return 'processed';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled';
    case 'PENDING':
    default:
      return 'pending';
  }
}

function mapOrderLines(
  lines: OrderLineApiRecord[] | null | undefined,
  currency: string,
): OrderSummaryLineDto[] {
  if (!Array.isArray(lines)) {
    return [];
  }
  return lines.map((line) => ({
    label: (line.label ?? line.description ?? 'Line item').trim() || 'Line item',
    amount: mapMoneyDisplay(resolveMinor(line.amountMinor, line.amount), line.currency ?? currency),
  }));
}

export function mapPaymentConfig(record: PaymentConfigApiRecord): PaymentConfigDto {
  const publicKey = record.publicKey ?? record.keyId ?? null;
  const configured = Boolean(record.configured && publicKey);
  return {
    configured,
    provider: (record.provider ?? 'razorpay').trim() || 'razorpay',
    publicKey: configured ? publicKey : null,
    currency: (record.currency ?? 'INR').trim().toUpperCase() || 'INR',
    message: record.message ?? (configured ? null : 'Payment provider is not configured.'),
  };
}

export function mapPaymentOrder(record: PaymentOrderApiRecord): PaymentOrderDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  return {
    id: record.id,
    organizationId: record.organizationId,
    purpose: mapPaymentPurpose(record.purpose),
    status: mapPaymentOrderStatus(record.status),
    currency,
    subtotal: mapMoneyDisplay(resolveMinor(record.subtotalMinor, record.subtotal), currency),
    discount: mapMoneyDisplay(resolveMinor(record.discountMinor, record.discount), currency),
    tax: mapMoneyDisplay(resolveMinor(record.taxMinor, record.tax), currency),
    total: mapMoneyDisplay(resolveMinor(record.totalMinor, record.total), currency),
    lines: mapOrderLines(record.lines, currency),
    courseId: record.courseId ?? null,
    batchId: record.batchId ?? null,
    planId: record.planId ?? null,
    couponCode: record.couponCode ?? null,
    providerOrderId: record.providerOrderId ?? null,
    checkoutPublicKey: record.checkoutPublicKey ?? record.keyId ?? null,
    receiptNumber: record.receiptNumber ?? null,
    failureReason: record.failureReason ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    paidAt: record.paidAt ?? null,
  };
}

export function mapPaymentHistoryItem(record: PaymentHistoryApiRecord): PaymentHistoryItemDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  return {
    id: record.id,
    orderId: record.orderId ?? record.id,
    purpose: mapPaymentPurpose(record.purpose),
    status: mapPaymentOrderStatus(record.status),
    description: (record.description ?? record.title ?? 'Payment').trim() || 'Payment',
    total: mapMoneyDisplay(resolveMinor(record.totalMinor, record.total), currency),
    createdAt: record.createdAt,
    paidAt: record.paidAt ?? null,
  };
}

export function mapInvoice(record: InvoiceApiRecord): InvoiceDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  return {
    id: record.id,
    organizationId: record.organizationId,
    orderId: record.orderId ?? null,
    invoiceNumber: record.invoiceNumber,
    status: mapInvoiceStatus(record.status),
    currency,
    subtotal: mapMoneyDisplay(resolveMinor(record.subtotalMinor, record.subtotal), currency),
    discount: mapMoneyDisplay(resolveMinor(record.discountMinor, record.discount), currency),
    tax: mapMoneyDisplay(resolveMinor(record.taxMinor, record.tax), currency),
    total: mapMoneyDisplay(resolveMinor(record.totalMinor, record.total), currency),
    lines: mapOrderLines(record.lines, currency),
    billedToName: record.billedToName ?? record.customerName ?? null,
    billedToEmail: record.billedToEmail ?? record.customerEmail ?? null,
    pdfUrl: record.pdfUrl ?? null,
    issuedAt: record.issuedAt ?? null,
    paidAt: record.paidAt ?? null,
    createdAt: record.createdAt,
  };
}

export function mapSubscription(record: SubscriptionApiRecord): SubscriptionDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  const planName = record.planName ?? record.plan?.name ?? 'Plan';
  return {
    id: record.id,
    organizationId: record.organizationId,
    planId: record.planId.length > 0 ? record.planId : (record.plan?.id ?? ''),
    planName,
    status: mapSubscriptionStatus(record.status),
    price: mapMoneyDisplay(resolveMinor(record.priceMinor, record.price), currency),
    interval: mapPlanInterval(record.interval),
    currentPeriodStart: record.currentPeriodStart ?? null,
    currentPeriodEnd: record.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(record.cancelAtPeriodEnd),
    canRenew: Boolean(record.canRenew),
    canUpgrade: Boolean(record.canUpgrade),
    renewMessage: record.renewMessage ?? null,
    upgradeMessage: record.upgradeMessage ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapCatalog(record: PaymentCatalogApiRecord): PaymentCatalogDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  const courses: CatalogCourseDto[] = (record.courses ?? []).map((course) => {
    const courseCurrency = (course.currency ?? currency).trim().toUpperCase() || currency;
    const batches: CatalogBatchDto[] = (course.batches ?? []).map((batch) => ({
      id: batch.id,
      name: batch.name,
      courseId: batch.courseId ?? course.id,
    }));
    return {
      id: course.id,
      title: course.title,
      description: course.description ?? null,
      price: mapMoneyDisplay(resolveMinor(course.priceMinor, course.price), courseCurrency),
      batches,
    };
  });

  const plans: CatalogPlanDto[] = (record.plans ?? []).map((plan) => {
    const planCurrency = (plan.currency ?? currency).trim().toUpperCase() || currency;
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description ?? null,
      price: mapMoneyDisplay(resolveMinor(plan.priceMinor, plan.price), planCurrency),
      interval: mapPlanInterval(plan.interval),
      features: Array.isArray(plan.features)
        ? plan.features.filter((f) => f.trim().length > 0)
        : [],
      isActive: plan.isActive !== false,
    };
  });

  return { courses, plans, currency };
}

export function mapAdminOverview(record: AdminOverviewApiRecord): AdminPaymentOverviewDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  return {
    organizationId: record.organizationId,
    generatedAt: record.generatedAt ?? new Date(0).toISOString(),
    currency,
    revenueTotal: mapMoneyDisplay(
      resolveMinor(record.revenueTotalMinor, record.revenueTotal),
      currency,
    ),
    revenueMonth: mapMoneyDisplay(
      resolveMinor(record.revenueMonthMinor, record.revenueMonth),
      currency,
    ),
    successfulPayments: asIntegerMinor(record.successfulPayments),
    failedPayments: asIntegerMinor(record.failedPayments),
    pendingPayments: asIntegerMinor(record.pendingPayments),
    activeSubscriptions: asIntegerMinor(record.activeSubscriptions),
    openRefunds: asIntegerMinor(record.openRefunds),
    issuedInvoices: asIntegerMinor(record.issuedInvoices),
  };
}

export function mapPlan(record: PlanApiRecord): PlanDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    description: record.description ?? null,
    price: mapMoneyDisplay(resolveMinor(record.priceMinor, record.price), currency),
    interval: mapPlanInterval(record.interval),
    features: Array.isArray(record.features)
      ? record.features.filter((f) => f.trim().length > 0)
      : [],
    isActive: record.isActive !== false,
    sortOrder: asIntegerMinor(record.sortOrder),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapTransaction(record: TransactionApiRecord): TransactionDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  const userName =
    record.userName ??
    ([record.user?.firstName, record.user?.lastName].filter(Boolean).join(' ').trim() || null);
  const status = mapPaymentOrderStatus(record.status);
  return {
    id: record.id,
    orderId: record.orderId,
    organizationId: record.organizationId,
    purpose: mapPaymentPurpose(record.purpose),
    status,
    description: (record.description ?? 'Transaction').trim() || 'Transaction',
    total: mapMoneyDisplay(resolveMinor(record.totalMinor, record.total), currency),
    provider: record.provider ?? null,
    providerOrderId: record.providerOrderId ?? null,
    providerPaymentId: record.providerPaymentId ?? null,
    userId: record.userId ?? record.user?.id ?? null,
    userEmail: record.userEmail ?? record.user?.email ?? null,
    userName,
    failureReason: record.failureReason ?? null,
    canRetry: record.canRetry === true || status === 'failed',
    createdAt: record.createdAt,
    paidAt: record.paidAt ?? null,
    updatedAt: record.updatedAt,
  };
}

export function mapRefund(record: RefundApiRecord): RefundDto {
  const currency = (record.currency ?? 'INR').trim().toUpperCase() || 'INR';
  return {
    id: record.id,
    organizationId: record.organizationId,
    orderId: record.orderId,
    transactionId: record.transactionId ?? null,
    status: mapRefundStatus(record.status),
    amount: mapMoneyDisplay(resolveMinor(record.amountMinor, record.amount), currency),
    reason: record.reason ?? null,
    createdAt: record.createdAt,
    processedAt: record.processedAt ?? null,
  };
}

export function mapCoupon(record: CouponApiRecord): CouponDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    code: record.code,
    description: record.description ?? null,
    discountType: mapCouponDiscountType(record.discountType),
    discountValue: asIntegerMinor(record.discountValue),
    currency: record.currency ? record.currency.trim().toUpperCase() : null,
    maxRedemptions: record.maxRedemptions ?? null,
    redemptionCount: asIntegerMinor(record.redemptionCount),
    isActive: record.isActive !== false,
    startsAt: record.startsAt ?? null,
    endsAt: record.endsAt ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapPaymentListMeta(meta: PaymentListMeta | undefined): PaymentListMetaDto {
  return {
    total: asIntegerMinor(meta?.total),
    page: Math.max(1, asIntegerMinor(meta?.page, 1)),
    limit: Math.max(1, asIntegerMinor(meta?.limit, 20)),
    totalPages: Math.max(0, asIntegerMinor(meta?.totalPages)),
  };
}

/** Exported for tests — ensures money helpers stay pure. */
export { mapMoneyFromRecord };
