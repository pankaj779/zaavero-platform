import type {
  BillingIntervalValue,
  CouponTypeValue,
  InvoiceStatusValue,
  OrderPurposeValue,
  OrderStatusValue,
  PaymentEventStatusValue,
  PaymentEventTypeValue,
  PaymentMethodTypeValue,
  PaymentSortField,
  PaymentStatusValue,
  PlanTierValue,
  RefundStatusValue,
  SubscriptionStatusValue,
} from '../constants/payment.constants';

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface OrderRecord {
  id: string;
  organizationId: string;
  customerId: string;
  provider: string;
  purpose: OrderPurposeValue;
  status: OrderStatusValue;
  courseId: string | null;
  batchId: string | null;
  planId: string | null;
  couponId: string | null;
  couponCode: string | null;
  courseTitleSnapshot: string | null;
  batchNameSnapshot: string | null;
  planNameSnapshot: string | null;
  intervalSnapshot: BillingIntervalValue | null;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  idempotencyKey: string;
  receipt: string;
  providerOrderId: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Latest captured payment for this order, when present. */
  paymentId: string | null;
  receiptPdfUrl: string | null;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  orderId: string;
  customerId: string;
  provider: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  amountMinor: number;
  currency: string;
  status: PaymentStatusValue;
  failureCode: string | null;
  failureReason: string | null;
  receiptPdfUrl: string | null;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  refundedMinor: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceRecord {
  id: string;
  organizationId: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceStatusValue;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  pdfUrl: string | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  customerName: string | null;
  customerEmail: string | null;
  orderPurpose: OrderPurposeValue | null;
  courseTitleSnapshot: string | null;
  batchNameSnapshot: string | null;
  planNameSnapshot: string | null;
  /** Latest captured payment for the invoice order, when present. */
  paymentId: string | null;
  receiptPdfUrl: string | null;
}

export interface PlanRecord {
  id: string;
  organizationId: string;
  tier: PlanTierValue;
  name: string;
  description: string | null;
  interval: BillingIntervalValue;
  amountMinor: number;
  currency: string;
  trialDays: number;
  features: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionRecord {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatusValue;
  planNameSnapshot: string;
  planTierSnapshot: PlanTierValue;
  intervalSnapshot: BillingIntervalValue;
  amountMinorSnapshot: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponRecord {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponTypeValue;
  amountOffMinor: number | null;
  percentOffBps: number | null;
  currency: string | null;
  minimumOrderMinor: number | null;
  maximumDiscountMinor: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundRecord {
  id: string;
  organizationId: string;
  paymentId: string;
  orderId: string;
  provider: string;
  providerRefundId: string | null;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  status: RefundStatusValue;
  reason: string | null;
  failureCode: string | null;
  failureReason: string | null;
  receiptPdfUrl: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionRecord {
  order: OrderRecord;
  latestPayment: PaymentRecord | null;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface PaymentEventRecord {
  id: string;
  provider: string;
  eventId: string;
  type: PaymentEventTypeValue;
  status: PaymentEventStatusValue;
  attempts: number;
  lastError: string | null;
  processedAt: Date | null;
  receivedAt: Date;
}

export interface CourseForPurchaseRecord {
  id: string;
  title: string;
  priceMinor: number;
  currency: string;
  status: string;
  isPurchasable: boolean;
}

export interface BatchForEnrollmentRecord {
  id: string;
  name: string;
  courseId: string;
  status: string;
}

export interface CatalogCourseRecord extends CourseForPurchaseRecord {
  description: string | null;
  batches: BatchForEnrollmentRecord[];
}

export interface BillingAddressRecord {
  id: string;
  organizationId: string;
  userId: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phone: string | null;
}

export interface PaymentOverviewRecord {
  revenueTotalMinor: number;
  revenueMonthMinor: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  activeSubscriptions: number;
  openRefunds: number;
  issuedInvoices: number;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface PaymentListFilters {
  organizationId: string;
  customerId?: string;
  status?: string;
  purpose?: OrderPurposeValue;
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy: PaymentSortField;
  sortOrder: 'asc' | 'desc';
}

export interface CreateOrderData {
  organizationId: string;
  customerId: string;
  createdById: string;
  provider: string;
  purpose: OrderPurposeValue;
  courseId?: string;
  batchId?: string;
  planId?: string;
  couponId?: string;
  courseTitleSnapshot?: string;
  batchNameSnapshot?: string;
  planNameSnapshot?: string;
  planTierSnapshot?: PlanTierValue;
  intervalSnapshot?: BillingIntervalValue;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  idempotencyKey: string;
  receipt: string;
  /** Draft invoice billing address; ownership is validated by the service. */
  billingAddressId?: string;
  billingAddressSnapshot: Record<string, unknown>;
}

export interface SafePaymentMethodData {
  type: PaymentMethodTypeValue;
  displayName?: string;
  cardNetwork?: string;
  cardLast4?: string;
  upiHandleMasked?: string;
  bankName?: string;
  walletName?: string;
}

export interface CapturePaymentData {
  orderId: string;
  organizationId: string;
  customerId: string;
  provider: string;
  providerPaymentId: string;
  providerOrderId: string | null;
  amountMinor: number;
  currency: string;
  /** True when the provider reports the payment as captured (settled). */
  captured: boolean;
  paymentMethod?: SafePaymentMethodData;
  /** Audit actor; null for webhook-driven captures. */
  actorUserId: string | null;
  paymentEventId?: string;
}

export interface CapturePaymentResult {
  order: OrderRecord;
  payment: PaymentRecord;
  /** True when this call performed fulfillment (first capture). */
  fulfilled: boolean;
  alreadyProcessed: boolean;
}

export interface RecordPaymentFailureData {
  organizationId: string;
  orderId: string;
  customerId: string;
  provider: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  amountMinor: number;
  currency: string;
  failureCode?: string;
  failureDescription?: string;
  failureSource?: string;
  failureStep?: string;
  failureReason?: string;
}

export interface CreateRefundData {
  organizationId: string;
  paymentId: string;
  orderId: string;
  requestedById: string | null;
  provider: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  reason?: string;
}

export interface FinalizeRefundData {
  refundId: string;
  status: RefundStatusValue;
  providerRefundId?: string;
  processedAt?: Date;
  failureCode?: string;
  failureReason?: string;
  actorUserId: string | null;
}

export interface CreatePlanData {
  organizationId: string;
  createdById: string;
  tier: PlanTierValue;
  name: string;
  description?: string;
  interval: BillingIntervalValue;
  amountMinor: number;
  currency: string;
  trialDays?: number;
  features?: unknown;
  isActive?: boolean;
}

export interface UpdatePlanData {
  name?: string;
  description?: string | null;
  amountMinor?: number;
  currency?: string;
  interval?: BillingIntervalValue;
  tier?: PlanTierValue;
  trialDays?: number;
  features?: unknown;
  isActive?: boolean;
}

export interface CreateCouponData {
  organizationId: string;
  createdById: string;
  code: string;
  name: string;
  description?: string;
  type: CouponTypeValue;
  amountOffMinor?: number;
  percentOffBps?: number;
  currency?: string;
  minimumOrderMinor?: number;
  maximumDiscountMinor?: number;
  maxRedemptions?: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface UpdateCouponData {
  name?: string;
  description?: string | null;
  type?: CouponTypeValue;
  amountOffMinor?: number | null;
  percentOffBps?: number | null;
  currency?: string | null;
  minimumOrderMinor?: number | null;
  maximumDiscountMinor?: number | null;
  maxRedemptions?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive?: boolean;
}

export interface AssignSubscriptionData {
  organizationId: string;
  planId: string;
  actorUserId: string;
  periodStart: Date;
  periodEnd: Date;
  trialEndsAt: Date | null;
  note?: string;
}

export interface CreatePaymentEventData {
  provider: string;
  eventId: string;
  type: PaymentEventTypeValue;
  payload: unknown;
  signatureHash: string;
  organizationId?: string;
}

export interface UpdatePaymentEventData {
  status: PaymentEventStatusValue;
  lastError?: string | null;
  processedAt?: Date;
  organizationId?: string;
  orderId?: string;
  paymentId?: string;
  refundId?: string;
  subscriptionId?: string;
}

export interface AuditEntry {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export interface PaymentsRepository {
  readonly marker: 'payments-repository';

  // Lookups used for amount authority and ownership checks
  findOrganizationCurrency(organizationId: string): Promise<string | null>;
  findCourseForPurchase(
    organizationId: string,
    courseId: string,
  ): Promise<CourseForPurchaseRecord | null>;
  findBatchForEnrollment(
    organizationId: string,
    batchId: string,
  ): Promise<BatchForEnrollmentRecord | null>;
  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;
  hasActiveEnrollment(batchId: string, studentProfileId: string): Promise<boolean>;
  findBillingAddress(
    organizationId: string,
    billingAddressId: string,
  ): Promise<BillingAddressRecord | null>;
  findCustomerContact(userId: string): Promise<{ name: string; email: string } | null>;

  // Catalog
  listCatalogCourses(organizationId: string): Promise<CatalogCourseRecord[]>;
  listActivePlans(organizationId: string): Promise<PlanRecord[]>;

  // Orders
  createOrder(data: CreateOrderData): Promise<OrderRecord>;
  findOrderById(id: string): Promise<OrderRecord | null>;
  findOrderByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<OrderRecord | null>;
  findOrderByProviderOrderId(
    provider: string,
    providerOrderId: string,
  ): Promise<OrderRecord | null>;
  attachProviderOrder(
    orderId: string,
    providerOrderId: string,
    expiresAt: Date,
  ): Promise<OrderRecord>;
  markOrderFailed(orderId: string): Promise<OrderRecord>;
  listOrders(filters: PaymentListFilters): Promise<ListResult<OrderRecord>>;

  // Payments / capture
  findPaymentById(id: string): Promise<PaymentRecord | null>;
  findPaymentByProviderPaymentId(
    provider: string,
    providerPaymentId: string,
  ): Promise<PaymentRecord | null>;
  findCapturedPaymentForOrder(orderId: string): Promise<PaymentRecord | null>;
  capturePayment(data: CapturePaymentData): Promise<CapturePaymentResult>;
  recordPaymentFailure(data: RecordPaymentFailureData): Promise<PaymentRecord>;

  // Invoices
  listInvoices(filters: PaymentListFilters): Promise<ListResult<InvoiceRecord>>;
  findInvoiceById(id: string): Promise<InvoiceRecord | null>;
  updateInvoicePdf(id: string, pdfUrl: string): Promise<InvoiceRecord>;

  // Subscriptions
  findCurrentSubscription(organizationId: string): Promise<SubscriptionRecord | null>;
  listSubscriptions(filters: PaymentListFilters): Promise<ListResult<SubscriptionRecord>>;
  assignSubscription(data: AssignSubscriptionData): Promise<SubscriptionRecord>;

  // Plans
  listPlans(filters: PaymentListFilters): Promise<ListResult<PlanRecord>>;
  findPlanById(organizationId: string, planId: string): Promise<PlanRecord | null>;
  createPlan(data: CreatePlanData): Promise<PlanRecord>;
  updatePlan(planId: string, data: UpdatePlanData): Promise<PlanRecord>;

  // Coupons
  findCouponByCode(organizationId: string, code: string): Promise<CouponRecord | null>;
  findCouponById(couponId: string): Promise<CouponRecord | null>;
  listCoupons(filters: PaymentListFilters): Promise<ListResult<CouponRecord>>;
  createCoupon(data: CreateCouponData): Promise<CouponRecord>;
  updateCoupon(couponId: string, data: UpdateCouponData): Promise<CouponRecord>;

  // Refunds
  findRefundByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<RefundRecord | null>;
  findRefundByProviderRefundId(
    provider: string,
    providerRefundId: string,
  ): Promise<RefundRecord | null>;
  findRefundById(refundId: string): Promise<RefundRecord | null>;
  sumReservedRefundsMinor(paymentId: string): Promise<number>;
  createRefund(data: CreateRefundData): Promise<RefundRecord>;
  finalizeRefund(data: FinalizeRefundData): Promise<RefundRecord>;
  listRefunds(filters: PaymentListFilters): Promise<ListResult<RefundRecord>>;

  // Transactions and overview
  listTransactions(filters: PaymentListFilters): Promise<ListResult<TransactionRecord>>;
  getOverview(organizationId: string, monthStart: Date): Promise<PaymentOverviewRecord>;

  // Webhook events
  createPaymentEvent(
    data: CreatePaymentEventData,
  ): Promise<{ created: boolean; event: PaymentEventRecord }>;
  updatePaymentEvent(eventId: string, data: UpdatePaymentEventData): Promise<void>;

  // Audit
  audit(entry: AuditEntry): Promise<void>;
}
