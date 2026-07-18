import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AlreadyEnrolledException,
  CouponInvalidException,
  CourseNotPurchasableException,
  IdempotencyKeyConflictException,
  IdempotencyKeyRequiredException,
  InvalidOrderRequestException,
  InvalidPaymentSignatureException,
  PaymentForbiddenException,
  PaymentOrganizationAccessDeniedException,
  PaymentProviderUnavailableException,
  PaymentVerificationMismatchException,
} from '../exceptions';
import { PaymentsService } from '../services/payments.service';
import {
  createAdmin,
  createCouponRecord,
  createOrderRecord,
  createPaymentRecord,
  createProviderMock,
  createRepositoryMock,
  createUser,
  type MockedProvider,
  type MockedRepository,
} from './payments-test.helpers';

const IDEMPOTENCY_KEY = 'key-1234567890';

describe('PaymentsService', () => {
  let repository: MockedRepository;
  let provider: MockedProvider;
  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createRepositoryMock();
    provider = createProviderMock();
    service = new PaymentsService(repository, provider);
  });

  describe('getConfig', () => {
    it('reports enabled=false without exposing a key when unconfigured', () => {
      provider.isConfigured.mockReturnValue(false);
      const result = service.getConfig();
      expect(result.data.configured).toBe(false);
      expect(result.data.keyId).toBeNull();
      expect(result.data.message).toBeTruthy();
    });

    it('exposes the public key id when configured', () => {
      const result = service.getConfig();
      expect(result.data.configured).toBe(true);
      expect(result.data.keyId).toBe('rzp_test_key');
    });
  });

  describe('createOrder (course purchase)', () => {
    const dto = {
      organizationId: 'org-1',
      purpose: 'COURSE_PURCHASE' as const,
      courseId: 'course-1',
      batchId: 'batch-1',
    };

    function arrangeHappyPath(): void {
      repository.findOrderByIdempotencyKey.mockResolvedValue(null);
      repository.findCourseForPurchase.mockResolvedValue({
        id: 'course-1',
        title: 'Graphology Basics',
        priceMinor: 50_000,
        currency: 'INR',
        status: 'PUBLISHED',
        isPurchasable: true,
      });
      repository.findBatchForEnrollment.mockResolvedValue({
        id: 'batch-1',
        name: 'Batch A',
        courseId: 'course-1',
        status: 'UPCOMING',
      });
      repository.findStudentProfileId.mockResolvedValue('student-1');
      repository.hasActiveEnrollment.mockResolvedValue(false);
      repository.findCustomerContact.mockResolvedValue({
        name: 'Student One',
        email: 'student@example.com',
      });
      repository.createOrder.mockResolvedValue(createOrderRecord({ status: 'DRAFT' }));
      provider.createOrder.mockResolvedValue({
        id: 'order_rzp1',
        amount: 50_000,
        currency: 'INR',
        receipt: 'rcpt_abc',
        status: 'created',
      });
      repository.attachProviderOrder.mockResolvedValue(
        createOrderRecord({ providerOrderId: 'order_rzp1' }),
      );
    }

    it('rejects requests without an Idempotency-Key header', async () => {
      await expect(service.createOrder(createUser(), dto, undefined)).rejects.toThrow(
        IdempotencyKeyRequiredException,
      );
    });

    it('rejects users outside the organization', async () => {
      await expect(
        service.createOrder(createUser({ organizationIds: ['other-org'] }), dto, IDEMPOTENCY_KEY),
      ).rejects.toThrow(PaymentOrganizationAccessDeniedException);
    });

    it('returns 503 when the provider is not configured', async () => {
      provider.isConfigured.mockReturnValue(false);
      await expect(service.createOrder(createUser(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        PaymentProviderUnavailableException,
      );
      expect(repository.createOrder).not.toHaveBeenCalled();
    });

    it('uses the server-side course price, never client input', async () => {
      arrangeHappyPath();
      await service.createOrder(createUser(), dto, IDEMPOTENCY_KEY);

      expect(repository.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotalMinor: 50_000,
          totalMinor: 50_000,
          currency: 'INR',
        }),
      );
      expect(provider.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50_000, currency: 'INR' }),
      );
    });

    it('rejects unpublished or non-purchasable courses', async () => {
      arrangeHappyPath();
      repository.findCourseForPurchase.mockResolvedValue({
        id: 'course-1',
        title: 'Draft course',
        priceMinor: 50_000,
        currency: 'INR',
        status: 'DRAFT',
        isPurchasable: true,
      });
      await expect(service.createOrder(createUser(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        CourseNotPurchasableException,
      );
    });

    it('rejects purchases when the student is already enrolled', async () => {
      arrangeHappyPath();
      repository.hasActiveEnrollment.mockResolvedValue(true);
      await expect(service.createOrder(createUser(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        AlreadyEnrolledException,
      );
    });

    it('returns the same order for the same idempotency key and target', async () => {
      repository.findOrderByIdempotencyKey.mockResolvedValue(createOrderRecord());
      const result = await service.createOrder(createUser(), dto, IDEMPOTENCY_KEY);
      expect(result.data.id).toBe('order-1');
      expect(repository.createOrder).not.toHaveBeenCalled();
      expect(provider.createOrder).not.toHaveBeenCalled();
    });

    it('rejects idempotency key reuse for a different target', async () => {
      repository.findOrderByIdempotencyKey.mockResolvedValue(
        createOrderRecord({ courseId: 'other-course' }),
      );
      await expect(service.createOrder(createUser(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        IdempotencyKeyConflictException,
      );
    });

    it('applies percentage coupons server-side with cap at subtotal', async () => {
      arrangeHappyPath();
      repository.findCouponByCode.mockResolvedValue(createCouponRecord({ percentOffBps: 1_000 }));
      await service.createOrder(createUser(), { ...dto, couponCode: 'WELCOME10' }, IDEMPOTENCY_KEY);
      expect(repository.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ discountMinor: 5_000, totalMinor: 45_000 }),
      );
    });

    it('rejects expired coupons', async () => {
      arrangeHappyPath();
      repository.findCouponByCode.mockResolvedValue(
        createCouponRecord({ expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
      );
      await expect(
        service.createOrder(createUser(), { ...dto, couponCode: 'WELCOME10' }, IDEMPOTENCY_KEY),
      ).rejects.toThrow(CouponInvalidException);
    });

    it('rejects orders whose total would be zero', async () => {
      arrangeHappyPath();
      repository.findCouponByCode.mockResolvedValue(createCouponRecord({ percentOffBps: 10_000 }));
      await expect(
        service.createOrder(createUser(), { ...dto, couponCode: 'WELCOME10' }, IDEMPOTENCY_KEY),
      ).rejects.toThrow(InvalidOrderRequestException);
    });

    it('marks the local order failed and audits when the provider call fails', async () => {
      arrangeHappyPath();
      provider.createOrder.mockRejectedValue(new Error('gateway down'));
      repository.markOrderFailed.mockResolvedValue(createOrderRecord({ status: 'FAILED' }));

      await expect(service.createOrder(createUser(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        'gateway down',
      );
      expect(repository.markOrderFailed).toHaveBeenCalledWith('order-1');
      expect(repository.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'payment.order.provider_failed' }),
      );
    });

    it('forbids subscription orders for non-admin users', async () => {
      repository.findOrderByIdempotencyKey.mockResolvedValue(null);
      await expect(
        service.createOrder(
          createUser(),
          {
            organizationId: 'org-1',
            purpose: 'ORGANIZATION_SUBSCRIPTION',
            planId: 'plan-1',
          },
          IDEMPOTENCY_KEY,
        ),
      ).rejects.toThrow(PaymentForbiddenException);
    });
  });

  describe('verifyPayment', () => {
    const dto = {
      organizationId: 'org-1',
      orderId: 'order-1',
      providerOrderId: 'order_rzp1',
      providerPaymentId: 'pay_rzp1',
      signature: 'a'.repeat(64),
    };

    it('forbids verifying an order that belongs to another user', async () => {
      repository.findOrderById.mockResolvedValue(createOrderRecord({ customerId: 'someone-else' }));
      await expect(service.verifyPayment(createUser(), dto)).rejects.toThrow(
        PaymentForbiddenException,
      );
    });

    it('allows admins to verify on behalf of a customer', async () => {
      repository.findOrderById.mockResolvedValue(
        createOrderRecord({ customerId: 'someone-else', status: 'PAID' }),
      );
      repository.findPaymentByProviderPaymentId.mockResolvedValue(createPaymentRecord());
      const result = await service.verifyPayment(createAdmin(), dto);
      expect(result.data.id).toBe('order-1');
    });

    it('rejects an invalid checkout signature before contacting the provider', async () => {
      repository.findOrderById.mockResolvedValue(createOrderRecord());
      provider.verifyCheckoutSignature.mockReturnValue(false);
      await expect(service.verifyPayment(createUser(), dto)).rejects.toThrow(
        InvalidPaymentSignatureException,
      );
      expect(provider.getPayment).not.toHaveBeenCalled();
      expect(repository.capturePayment).not.toHaveBeenCalled();
    });

    it('rejects when the provider order id does not match the order', async () => {
      repository.findOrderById.mockResolvedValue(
        createOrderRecord({ providerOrderId: 'order_other' }),
      );
      await expect(service.verifyPayment(createUser(), dto)).rejects.toThrow(
        PaymentVerificationMismatchException,
      );
    });

    it('rejects when the provider payment amount differs from the order total', async () => {
      repository.findOrderById.mockResolvedValue(createOrderRecord());
      repository.findPaymentByProviderPaymentId.mockResolvedValue(null);
      provider.getPayment.mockResolvedValue({
        id: 'pay_rzp1',
        orderId: 'order_rzp1',
        amount: 1, // tampered
        currency: 'INR',
        status: 'captured',
        captured: true,
        method: 'upi',
        email: null,
        contact: null,
        bank: null,
        wallet: null,
        vpa: null,
        cardLast4: null,
        cardNetwork: null,
        errorCode: null,
        errorDescription: null,
        createdAt: new Date(),
      });
      await expect(service.verifyPayment(createUser(), dto)).rejects.toThrow(
        PaymentVerificationMismatchException,
      );
      expect(repository.capturePayment).not.toHaveBeenCalled();
    });

    it('captures atomically when the provider confirms the payment', async () => {
      repository.findOrderById.mockResolvedValue(createOrderRecord());
      repository.findPaymentByProviderPaymentId.mockResolvedValue(null);
      provider.getPayment.mockResolvedValue({
        id: 'pay_rzp1',
        orderId: 'order_rzp1',
        amount: 50_000,
        currency: 'INR',
        status: 'captured',
        captured: true,
        method: 'upi',
        email: null,
        contact: null,
        bank: null,
        wallet: null,
        vpa: 'student@upi',
        cardLast4: null,
        cardNetwork: null,
        errorCode: null,
        errorDescription: null,
        createdAt: new Date(),
      });
      repository.capturePayment.mockResolvedValue({
        order: createOrderRecord({ status: 'PAID', paidAt: new Date() }),
        payment: createPaymentRecord(),
        fulfilled: true,
        alreadyProcessed: false,
      });

      const result = await service.verifyPayment(createUser(), dto);

      expect(repository.capturePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          providerPaymentId: 'pay_rzp1',
          amountMinor: 50_000,
          captured: true,
        }),
      );
      // Masked UPI handle only — never the raw VPA.
      const captureArgs = repository.capturePayment.mock.calls[0]?.[0] as {
        paymentMethod?: { type: string; upiHandleMasked?: string };
      };
      expect(captureArgs.paymentMethod).toEqual({
        type: 'UPI',
        displayName: 'UPI',
        upiHandleMasked: 'st***@upi',
      });
      expect(result.data.status).toBe('PAID');
    });

    it('returns the existing result for a repeated verify call', async () => {
      repository.findOrderById.mockResolvedValue(createOrderRecord({ status: 'PAID' }));
      repository.findPaymentByProviderPaymentId.mockResolvedValue(createPaymentRecord());

      const result = await service.verifyPayment(createUser(), dto);

      expect(result.message).toContain('already');
      expect(provider.getPayment).not.toHaveBeenCalled();
      expect(repository.capturePayment).not.toHaveBeenCalled();
    });
  });

  describe('reads', () => {
    it('scopes order listings to the requesting user', async () => {
      repository.listOrders.mockResolvedValue({ items: [createOrderRecord()], total: 1 });
      const result = await service.listOrders(createUser(), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(repository.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', customerId: 'user-1' }),
      );
      expect(result.data.meta.total).toBe(1);
    });

    it('returns null data when no subscription is active', async () => {
      repository.findCurrentSubscription.mockResolvedValue(null);
      const result = await service.getCurrentSubscription(createUser(), {});
      expect(result.data).toBeNull();
    });
  });
});
