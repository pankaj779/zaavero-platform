import { vi, type Mock } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type {
  CouponRecord,
  OrderRecord,
  PaymentRecord,
  PaymentsRepository,
  PlanRecord,
  RefundRecord,
  SubscriptionRecord,
} from '../interfaces/payments-repository.interface';
import type { PaymentProvider } from '../providers/payment-provider.interface';

export type MockedRepository = {
  [K in keyof PaymentsRepository]: PaymentsRepository[K] extends (...args: never[]) => unknown
    ? Mock
    : PaymentsRepository[K];
};

export function createRepositoryMock(): MockedRepository {
  return {
    marker: 'payments-repository',
    findOrganizationCurrency: vi.fn(),
    findCourseForPurchase: vi.fn(),
    findBatchForEnrollment: vi.fn(),
    findStudentProfileId: vi.fn(),
    hasActiveEnrollment: vi.fn(),
    findBillingAddress: vi.fn(),
    findCustomerContact: vi.fn(),
    listCatalogCourses: vi.fn(),
    listActivePlans: vi.fn(),
    createOrder: vi.fn(),
    findOrderById: vi.fn(),
    findOrderByIdempotencyKey: vi.fn(),
    findOrderByProviderOrderId: vi.fn(),
    attachProviderOrder: vi.fn(),
    markOrderFailed: vi.fn(),
    listOrders: vi.fn(),
    findPaymentByProviderPaymentId: vi.fn(),
    findCapturedPaymentForOrder: vi.fn(),
    capturePayment: vi.fn(),
    recordPaymentFailure: vi.fn(),
    listInvoices: vi.fn(),
    findInvoiceById: vi.fn(),
    updateInvoicePdf: vi.fn(),
    findCurrentSubscription: vi.fn(),
    listSubscriptions: vi.fn(),
    assignSubscription: vi.fn(),
    listPlans: vi.fn(),
    findPlanById: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    findCouponByCode: vi.fn(),
    findCouponById: vi.fn(),
    listCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    findRefundByIdempotencyKey: vi.fn(),
    findRefundByProviderRefundId: vi.fn(),
    findRefundById: vi.fn(),
    sumReservedRefundsMinor: vi.fn(),
    createRefund: vi.fn(),
    finalizeRefund: vi.fn(),
    listRefunds: vi.fn(),
    listTransactions: vi.fn(),
    getOverview: vi.fn(),
    createPaymentEvent: vi.fn(),
    updatePaymentEvent: vi.fn(),
    audit: vi.fn().mockResolvedValue(undefined),
  };
}

export interface MockedProvider extends PaymentProvider {
  isConfigured: Mock;
  getPublicKeyId: Mock;
  createOrder: Mock;
  getPayment: Mock;
  refundPayment: Mock;
  verifyCheckoutSignature: Mock;
  verifyWebhookSignature: Mock;
}

export function createProviderMock(): MockedProvider {
  return {
    name: 'RAZORPAY',
    isConfigured: vi.fn().mockReturnValue(true),
    getPublicKeyId: vi.fn().mockReturnValue('rzp_test_key'),
    createOrder: vi.fn(),
    getPayment: vi.fn(),
    refundPayment: vi.fn(),
    verifyCheckoutSignature: vi.fn().mockReturnValue(true),
    verifyWebhookSignature: vi.fn().mockReturnValue(true),
  };
}

export function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'student@example.com',
    roles: [AUTH_ROLES.student],
    permissions: [],
    organizationIds: ['org-1'],
    ...overrides,
  };
}

export function createAdmin(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return createUser({
    id: 'user-admin',
    email: 'admin@example.com',
    roles: [AUTH_ROLES.admin],
    permissions: [AUTH_PERMISSIONS.paymentManage],
    ...overrides,
  });
}

export function createOrderRecord(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    organizationId: 'org-1',
    customerId: 'user-1',
    provider: 'RAZORPAY',
    purpose: 'COURSE_PURCHASE',
    status: 'CREATED',
    courseId: 'course-1',
    batchId: 'batch-1',
    planId: null,
    couponId: null,
    couponCode: null,
    courseTitleSnapshot: 'Graphology Basics',
    batchNameSnapshot: 'Batch A',
    planNameSnapshot: null,
    intervalSnapshot: null,
    subtotalMinor: 50_000,
    discountMinor: 0,
    taxMinor: 0,
    totalMinor: 50_000,
    currency: 'INR',
    idempotencyKey: 'key-1234567890',
    receipt: 'rcpt_abc',
    providerOrderId: 'order_rzp1',
    expiresAt: null,
    paidAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createPaymentRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: 'payment-1',
    organizationId: 'org-1',
    orderId: 'order-1',
    customerId: 'user-1',
    provider: 'RAZORPAY',
    providerPaymentId: 'pay_rzp1',
    providerOrderId: 'order_rzp1',
    amountMinor: 50_000,
    currency: 'INR',
    status: 'CAPTURED',
    failureCode: null,
    failureReason: null,
    authorizedAt: null,
    capturedAt: new Date('2026-07-01T00:05:00.000Z'),
    refundedMinor: 0,
    createdAt: new Date('2026-07-01T00:05:00.000Z'),
    updatedAt: new Date('2026-07-01T00:05:00.000Z'),
    ...overrides,
  };
}

export function createPlanRecord(overrides: Partial<PlanRecord> = {}): PlanRecord {
  return {
    id: 'plan-1',
    organizationId: 'org-1',
    tier: 'BASIC',
    name: 'Basic',
    description: null,
    interval: 'MONTHLY',
    amountMinor: 99_900,
    currency: 'INR',
    trialDays: 0,
    features: ['Feature one'],
    isActive: true,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createCouponRecord(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    id: 'coupon-1',
    organizationId: 'org-1',
    code: 'WELCOME10',
    name: 'Welcome',
    description: null,
    type: 'PERCENTAGE',
    amountOffMinor: null,
    percentOffBps: 1_000,
    currency: null,
    minimumOrderMinor: null,
    maximumDiscountMinor: null,
    maxRedemptions: null,
    redemptionCount: 0,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createRefundRecord(overrides: Partial<RefundRecord> = {}): RefundRecord {
  return {
    id: 'refund-1',
    organizationId: 'org-1',
    paymentId: 'payment-1',
    orderId: 'order-1',
    provider: 'RAZORPAY',
    providerRefundId: null,
    idempotencyKey: 'refund-key-123',
    amountMinor: 10_000,
    currency: 'INR',
    status: 'PENDING',
    reason: 'Requested by student',
    failureCode: null,
    failureReason: null,
    processedAt: null,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    ...overrides,
  };
}

export function createSubscriptionRecord(
  overrides: Partial<SubscriptionRecord> = {},
): SubscriptionRecord {
  return {
    id: 'sub-1',
    organizationId: 'org-1',
    planId: 'plan-1',
    status: 'ACTIVE',
    planNameSnapshot: 'Basic',
    planTierSnapshot: 'BASIC',
    intervalSnapshot: 'MONTHLY',
    amountMinorSnapshot: 99_900,
    currency: 'INR',
    currentPeriodStart: new Date('2026-07-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-08-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  };
}
