import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BILLING_INTERVALS,
  INVOICE_STATUSES,
  ORDER_PURPOSES,
  ORDER_STATUSES,
  PLAN_TIERS,
  REFUND_STATUSES,
  SUBSCRIPTION_STATUSES,
  type BillingIntervalValue,
  type InvoiceStatusValue,
  type OrderPurposeValue,
  type OrderStatusValue,
  type PlanTierValue,
  type RefundStatusValue,
  type SubscriptionStatusValue,
} from '../constants/payment.constants';

export class PaymentListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaymentConfigResponseDto {
  @ApiProperty({ description: 'True when checkout is available' })
  configured!: boolean;

  @ApiProperty({ example: 'RAZORPAY' })
  provider!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Public checkout key id' })
  keyId!: string | null;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  message!: string | null;
}

export class OrderLineResponseDto {
  @ApiProperty()
  label!: string;

  @ApiProperty({ description: 'Minor units; negative for discounts' })
  amountMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;
}

export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ enum: ORDER_PURPOSES })
  purpose!: OrderPurposeValue;

  @ApiProperty({ enum: ORDER_STATUSES })
  status!: OrderStatusValue;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty()
  subtotalMinor!: number;

  @ApiProperty()
  discountMinor!: number;

  @ApiProperty()
  taxMinor!: number;

  @ApiProperty()
  totalMinor!: number;

  @ApiProperty({ type: [OrderLineResponseDto] })
  lines!: OrderLineResponseDto[];

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  courseId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  batchId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  planId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  couponCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  providerOrderId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Public key for Razorpay Checkout',
  })
  checkoutPublicKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  receiptNumber!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  paidAt!: string | null;
}

export class PaginatedOrdersResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  items!: OrderResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class PaymentHistoryItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;

  @ApiProperty({ enum: ORDER_PURPOSES })
  purpose!: OrderPurposeValue;

  @ApiProperty({ enum: ORDER_STATUSES })
  status!: OrderStatusValue;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  totalMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  paidAt!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  receiptPdfUrl!: string | null;
}

export class PaginatedHistoryResponseDto {
  @ApiProperty({ type: [PaymentHistoryItemResponseDto] })
  items!: PaymentHistoryItemResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentId!: string | null;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty({ enum: INVOICE_STATUSES })
  status!: InvoiceStatusValue;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty()
  subtotalMinor!: number;

  @ApiProperty()
  discountMinor!: number;

  @ApiProperty()
  taxMinor!: number;

  @ApiProperty()
  totalMinor!: number;

  @ApiProperty({ type: [OrderLineResponseDto] })
  lines!: OrderLineResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  billedToName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  billedToEmail!: string | null;

  @ApiPropertyOptional({ nullable: true })
  pdfUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  receiptPdfUrl!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  issuedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  paidAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class PaginatedInvoicesResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  items!: InvoiceResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class SubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  planId!: string;

  @ApiProperty()
  planName!: string;

  @ApiProperty({ enum: PLAN_TIERS })
  planTier!: PlanTierValue;

  @ApiProperty({ enum: SUBSCRIPTION_STATUSES })
  status!: SubscriptionStatusValue;

  @ApiProperty()
  priceMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ enum: BILLING_INTERVALS })
  interval!: BillingIntervalValue;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  currentPeriodStart!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  currentPeriodEnd!: string | null;

  @ApiProperty()
  cancelAtPeriodEnd!: boolean;

  @ApiProperty()
  canRenew!: boolean;

  @ApiProperty()
  canUpgrade!: boolean;

  @ApiPropertyOptional({ nullable: true })
  renewMessage!: string | null;

  @ApiPropertyOptional({ nullable: true })
  upgradeMessage!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class PaginatedSubscriptionsResponseDto {
  @ApiProperty({ type: [SubscriptionResponseDto] })
  items!: SubscriptionResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class CatalogBatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;
}

export class CatalogCourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  priceMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ type: [CatalogBatchResponseDto] })
  batches!: CatalogBatchResponseDto[];
}

export class CatalogPlanResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  priceMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ enum: BILLING_INTERVALS })
  interval!: BillingIntervalValue;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty()
  isActive!: boolean;
}

export class PaymentCatalogResponseDto {
  @ApiProperty({ type: [CatalogCourseResponseDto] })
  courses!: CatalogCourseResponseDto[];

  @ApiProperty({ type: [CatalogPlanResponseDto] })
  plans!: CatalogPlanResponseDto[];

  @ApiProperty({ example: 'INR' })
  currency!: string;
}

export class PlanResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: PLAN_TIERS })
  tier!: PlanTierValue;

  @ApiProperty()
  priceMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ enum: BILLING_INTERVALS })
  interval!: BillingIntervalValue;

  @ApiProperty()
  trialDays!: number;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'Always 0; ordering is not persisted' })
  sortOrder!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class PaginatedPlansResponseDto {
  @ApiProperty({ type: [PlanResponseDto] })
  items!: PlanResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class TransactionResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Order id (one row per order)' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ enum: ORDER_PURPOSES })
  purpose!: OrderPurposeValue;

  @ApiProperty({ description: 'Latest payment status, or order status when unpaid' })
  status!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  totalMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ example: 'RAZORPAY' })
  provider!: string;

  @ApiPropertyOptional({ nullable: true })
  providerOrderId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  providerPaymentId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userEmail!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  failureReason!: string | null;

  @ApiProperty()
  canRetry!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  paidAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  items!: TransactionResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class RefundResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;

  @ApiProperty({ format: 'uuid', description: 'Local payment id' })
  transactionId!: string;

  @ApiProperty({ enum: REFUND_STATUSES })
  status!: RefundStatusValue;

  @ApiProperty()
  amountMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  receiptPdfUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  processedAt!: string | null;
}

export class GeneratedPdfResponseDto {
  @ApiProperty({ description: 'Secure URL of the stored PDF' })
  url!: string;

  @ApiProperty({ description: 'True when a new document was rendered and stored' })
  generated!: boolean;
}

export class PaginatedRefundsResponseDto {
  @ApiProperty({ type: [RefundResponseDto] })
  items!: RefundResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class CouponResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ['percent', 'fixed'] })
  discountType!: 'percent' | 'fixed';

  @ApiProperty({
    description: 'Percent points for percent coupons; minor units for fixed coupons',
  })
  discountValue!: number;

  @ApiPropertyOptional({ nullable: true, example: 'INR' })
  currency!: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxRedemptions!: number | null;

  @ApiProperty()
  redemptionCount!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startsAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endsAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class PaginatedCouponsResponseDto {
  @ApiProperty({ type: [CouponResponseDto] })
  items!: CouponResponseDto[];

  @ApiProperty({ type: PaymentListMetaDto })
  meta!: PaymentListMetaDto;
}

export class AdminPaymentOverviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  generatedAt!: string;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty()
  revenueTotalMinor!: number;

  @ApiProperty()
  revenueMonthMinor!: number;

  @ApiProperty()
  successfulPayments!: number;

  @ApiProperty()
  failedPayments!: number;

  @ApiProperty()
  pendingPayments!: number;

  @ApiProperty()
  activeSubscriptions!: number;

  @ApiProperty()
  openRefunds!: number;

  @ApiProperty()
  issuedInvoices!: number;
}

export class WebhookAckResponseDto {
  @ApiProperty()
  received!: boolean;

  @ApiProperty({ description: 'True when the event had already been processed' })
  duplicate!: boolean;

  @ApiProperty()
  processed!: boolean;
}
