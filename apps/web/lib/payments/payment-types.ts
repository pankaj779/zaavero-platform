/**
 * Shared frontend payment DTOs — used by student and admin workspaces.
 * Components consume these types only; never NestJS raw payloads.
 */

export type PaymentPurpose = 'COURSE_PURCHASE' | 'ORGANIZATION_SUBSCRIPTION';

export type PaymentOrderStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'expired';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void' | 'refunded';

export type SubscriptionStatus =
  'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | 'incomplete';

export type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'custom';

export type CouponDiscountType = 'percent' | 'fixed';

export type RefundStatus = 'pending' | 'processed' | 'failed' | 'cancelled';

export interface PaymentListMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Integer minor-unit money with a display string derived for UI only. */
export interface MoneyDisplayDto {
  amountMinor: number;
  currency: string;
  formatted: string;
}

export interface PaymentConfigDto {
  configured: boolean;
  provider: string;
  /** Public checkout key only — never a secret. */
  publicKey: string | null;
  currency: string;
  message: string | null;
}

export interface CatalogCourseDto {
  id: string;
  title: string;
  description: string | null;
  price: MoneyDisplayDto;
  batches: CatalogBatchDto[];
}

export interface CatalogBatchDto {
  id: string;
  name: string;
  courseId: string;
}

export interface CatalogPlanDto {
  id: string;
  name: string;
  description: string | null;
  price: MoneyDisplayDto;
  interval: PlanInterval;
  features: string[];
  isActive: boolean;
}

export interface PaymentCatalogDto {
  courses: CatalogCourseDto[];
  plans: CatalogPlanDto[];
  currency: string;
}

export interface OrderSummaryLineDto {
  label: string;
  amount: MoneyDisplayDto;
}

export interface PaymentOrderDto {
  id: string;
  organizationId: string;
  purpose: PaymentPurpose;
  status: PaymentOrderStatus;
  currency: string;
  /** Backend-authoritative amounts — display only. */
  subtotal: MoneyDisplayDto;
  discount: MoneyDisplayDto;
  tax: MoneyDisplayDto;
  total: MoneyDisplayDto;
  lines: OrderSummaryLineDto[];
  courseId: string | null;
  batchId: string | null;
  planId: string | null;
  couponCode: string | null;
  providerOrderId: string | null;
  /** Public key for checkout when order is payable. */
  checkoutPublicKey: string | null;
  receiptNumber: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface CreateOrderInput {
  organizationId: string;
  purpose: PaymentPurpose;
  courseId?: string;
  batchId?: string;
  planId?: string;
  couponCode?: string;
  billingAddressId?: string;
}

export interface VerifyPaymentInput {
  organizationId: string;
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentHistoryItemDto {
  id: string;
  orderId: string;
  purpose: PaymentPurpose;
  status: PaymentOrderStatus;
  description: string;
  total: MoneyDisplayDto;
  createdAt: string;
  paidAt: string | null;
  paymentId: string | null;
  receiptPdfUrl: string | null;
}

export interface InvoiceDto {
  id: string;
  organizationId: string;
  orderId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: MoneyDisplayDto;
  discount: MoneyDisplayDto;
  tax: MoneyDisplayDto;
  total: MoneyDisplayDto;
  lines: OrderSummaryLineDto[];
  billedToName: string | null;
  billedToEmail: string | null;
  pdfUrl: string | null;
  paymentId: string | null;
  paymentReceiptPdfUrl: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface SubscriptionDto {
  id: string;
  organizationId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  price: MoneyDisplayDto;
  interval: PlanInterval;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canRenew: boolean;
  canUpgrade: boolean;
  renewMessage: string | null;
  upgradeMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentOverviewDto {
  organizationId: string;
  generatedAt: string;
  currency: string;
  revenueTotal: MoneyDisplayDto;
  revenueMonth: MoneyDisplayDto;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  activeSubscriptions: number;
  openRefunds: number;
  issuedInvoices: number;
}

export interface PlanDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  price: MoneyDisplayDto;
  interval: PlanInterval;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  organizationId: string;
  name: string;
  description?: string | null;
  /** Minor units — backend validates. */
  priceMinor: number;
  currency: string;
  interval: PlanInterval;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string | null;
  priceMinor?: number;
  currency?: string;
  interval?: PlanInterval;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface TransactionDto {
  id: string;
  orderId: string;
  organizationId: string;
  purpose: PaymentPurpose;
  status: PaymentOrderStatus;
  description: string;
  total: MoneyDisplayDto;
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paymentId: string | null;
  receiptPdfUrl: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  failureReason: string | null;
  canRetry: boolean;
  createdAt: string;
  paidAt: string | null;
  updatedAt: string;
}

export interface RefundDto {
  id: string;
  organizationId: string;
  orderId: string;
  transactionId: string | null;
  status: RefundStatus;
  amount: MoneyDisplayDto;
  reason: string | null;
  receiptPdfUrl: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface CreateRefundInput {
  organizationId: string;
  orderId: string;
  /** Requested minor units — backend validates and may adjust. */
  amountMinor: number;
  reason?: string;
}

export interface AssignSubscriptionInput {
  organizationId: string;
  planId: string;
  userId?: string;
  note?: string;
}

export interface CouponDto {
  id: string;
  organizationId: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  /** Percent points (e.g. 10) or fixed minor units — interpret via discountType. */
  discountValue: number;
  currency: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  organizationId: string;
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  currency?: string | null;
  maxRedemptions?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateCouponInput {
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  currency?: string | null;
  maxRedemptions?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface PaymentListResult<T> {
  items: T[];
  meta: PaymentListMetaDto;
}

export const paymentPurposeLabels: Record<PaymentPurpose, string> = {
  COURSE_PURCHASE: 'Course purchase',
  ORGANIZATION_SUBSCRIPTION: 'Organization subscription',
};

export const paymentOrderStatusLabels: Record<PaymentOrderStatus, string> = {
  created: 'Created',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
  expired: 'Expired',
};
