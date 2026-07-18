export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export const PAYMENT_DEFAULT_CURRENCY = 'INR';
export const PAYMENT_ORDER_TTL_MINUTES = 30;
export const PAYMENT_MAX_PAGE_SIZE = 100;
export const PAYMENT_DEFAULT_PAGE = 1;
export const PAYMENT_DEFAULT_LIMIT = 20;

export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const IDEMPOTENCY_KEY_MIN_LENGTH = 8;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

export const ORDER_PURPOSES = ['COURSE_PURCHASE', 'ORGANIZATION_SUBSCRIPTION'] as const;
export type OrderPurposeValue = (typeof ORDER_PURPOSES)[number];

export const ORDER_STATUSES = [
  'DRAFT',
  'CREATED',
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'CREATED',
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'CANCELLED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const INVOICE_STATUSES = ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'] as const;
export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = [
  'CREATED',
  'AUTHENTICATED',
  'ACTIVE',
  'PAST_DUE',
  'PAUSED',
  'CANCELLED',
  'COMPLETED',
  'EXPIRED',
] as const;
export type SubscriptionStatusValue = (typeof SUBSCRIPTION_STATUSES)[number];

export const REFUND_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'CANCELLED',
] as const;
export type RefundStatusValue = (typeof REFUND_STATUSES)[number];

export const PLAN_TIERS = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'] as const;
export type PlanTierValue = (typeof PLAN_TIERS)[number];

export const BILLING_INTERVALS = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
export type BillingIntervalValue = (typeof BILLING_INTERVALS)[number];

export const COUPON_TYPES = ['FIXED_AMOUNT', 'PERCENTAGE'] as const;
export type CouponTypeValue = (typeof COUPON_TYPES)[number];

export const PAYMENT_EVENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'IGNORED',
] as const;
export type PaymentEventStatusValue = (typeof PAYMENT_EVENT_STATUSES)[number];

export const PAYMENT_EVENT_TYPES = [
  'ORDER_PAID',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_CAPTURED',
  'PAYMENT_FAILED',
  'REFUND_CREATED',
  'REFUND_PROCESSED',
  'REFUND_FAILED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_CHARGED',
  'SUBSCRIPTION_PAUSED',
  'SUBSCRIPTION_CANCELLED',
  'OTHER',
] as const;
export type PaymentEventTypeValue = (typeof PAYMENT_EVENT_TYPES)[number];

export const PAYMENT_METHOD_TYPES = [
  'CARD',
  'UPI',
  'NETBANKING',
  'WALLET',
  'EMI',
  'BANK_TRANSFER',
  'OTHER',
] as const;
export type PaymentMethodTypeValue = (typeof PAYMENT_METHOD_TYPES)[number];

export const PAYMENT_SORT_FIELDS = ['createdAt', 'updatedAt', 'totalMinor', 'status'] as const;
export type PaymentSortField = (typeof PAYMENT_SORT_FIELDS)[number];

/** Order statuses from which an admin retry may issue a fresh provider order. */
export const RETRYABLE_ORDER_STATUSES: readonly OrderStatusValue[] = [
  'CREATED',
  'PENDING',
  'FAILED',
  'EXPIRED',
] as const;

/** Refund rows that count against the refundable balance of a payment. */
export const REFUND_RESERVING_STATUSES: readonly RefundStatusValue[] = [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
] as const;

export const PAYMENT_AUDIT_ACTIONS = {
  orderCreate: 'payment.order.create',
  orderProviderFailed: 'payment.order.provider_failed',
  orderRetry: 'payment.order.retry',
  paymentCaptured: 'payment.payment.captured',
  paymentAuthorized: 'payment.payment.authorized',
  paymentFailed: 'payment.payment.failed',
  refundRequest: 'payment.refund.request',
  refundProcessed: 'payment.refund.processed',
  refundFailed: 'payment.refund.failed',
  planCreate: 'payment.plan.create',
  planUpdate: 'payment.plan.update',
  couponCreate: 'payment.coupon.create',
  couponUpdate: 'payment.coupon.update',
  subscriptionAssign: 'payment.subscription.assign',
  webhookReceived: 'payment.webhook.received',
} as const;
