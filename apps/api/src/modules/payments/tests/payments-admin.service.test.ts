import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IdempotencyKeyConflictException,
  InvalidOrderStateException,
  InvalidRefundAmountException,
  PaymentNotFoundException,
  PlanConflictException,
  PlanNotFoundException,
} from '../exceptions';
import { PaymentsAdminService } from '../services/payments-admin.service';
import { PaymentsService } from '../services/payments.service';
import {
  createAdmin,
  createOrderRecord,
  createPaymentRecord,
  createPlanRecord,
  createProviderMock,
  createRefundRecord,
  createRepositoryMock,
  createSubscriptionRecord,
  type MockedProvider,
  type MockedRepository,
} from './payments-test.helpers';

const IDEMPOTENCY_KEY = 'refund-key-123';

describe('PaymentsAdminService', () => {
  let repository: MockedRepository;
  let provider: MockedProvider;
  let service: PaymentsAdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createRepositoryMock();
    provider = createProviderMock();
    const paymentsService = new PaymentsService(repository, provider);
    service = new PaymentsAdminService(repository, provider, paymentsService);
  });

  describe('createRefund', () => {
    const dto = {
      organizationId: 'org-1',
      orderId: 'order-1',
      amountMinor: 10_000,
      reason: 'Requested by student',
    };

    function arrangeHappyPath(): void {
      repository.findRefundByIdempotencyKey.mockResolvedValue(null);
      repository.findOrderById.mockResolvedValue(createOrderRecord({ status: 'PAID' }));
      repository.findCapturedPaymentForOrder.mockResolvedValue(createPaymentRecord());
      repository.sumReservedRefundsMinor.mockResolvedValue(0);
      repository.createRefund.mockResolvedValue(createRefundRecord());
      provider.refundPayment.mockResolvedValue({
        id: 'rfnd_1',
        paymentId: 'pay_rzp1',
        amount: 10_000,
        currency: 'INR',
        status: 'processed',
        createdAt: new Date(),
      });
      repository.finalizeRefund.mockResolvedValue(
        createRefundRecord({
          status: 'PROCESSED',
          providerRefundId: 'rfnd_1',
          processedAt: new Date(),
        }),
      );
    }

    it('rejects refunds exceeding the refundable balance', async () => {
      arrangeHappyPath();
      // 45k already reserved out of a 50k capture; only 5k remains.
      repository.sumReservedRefundsMinor.mockResolvedValue(45_000);
      await expect(service.createRefund(createAdmin(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        InvalidRefundAmountException,
      );
      expect(repository.createRefund).not.toHaveBeenCalled();
      expect(provider.refundPayment).not.toHaveBeenCalled();
    });

    it('rejects refunds for orders without a captured payment', async () => {
      arrangeHappyPath();
      repository.findCapturedPaymentForOrder.mockResolvedValue(null);
      await expect(service.createRefund(createAdmin(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        PaymentNotFoundException,
      );
    });

    it('records the pending refund before the provider call, then finalizes it', async () => {
      arrangeHappyPath();
      const result = await service.createRefund(createAdmin(), dto, IDEMPOTENCY_KEY);

      expect(repository.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: IDEMPOTENCY_KEY,
          amountMinor: 10_000,
        }),
      );
      expect(provider.refundPayment).toHaveBeenCalledWith(
        expect.objectContaining({ paymentId: 'pay_rzp1', amount: 10_000 }),
      );
      expect(repository.finalizeRefund).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PROCESSED', providerRefundId: 'rfnd_1' }),
      );
      expect(result.data.status).toBe('PROCESSED');
    });

    it('marks the refund failed when the provider call throws', async () => {
      arrangeHappyPath();
      provider.refundPayment.mockRejectedValue(new Error('provider down'));
      repository.finalizeRefund.mockResolvedValue(createRefundRecord({ status: 'FAILED' }));

      await expect(service.createRefund(createAdmin(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        'provider down',
      );
      expect(repository.finalizeRefund).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED' }),
      );
    });

    it('returns the existing refund for a duplicate idempotency key', async () => {
      repository.findRefundByIdempotencyKey.mockResolvedValue(createRefundRecord());
      const result = await service.createRefund(createAdmin(), dto, IDEMPOTENCY_KEY);
      expect(result.data.id).toBe('refund-1');
      expect(repository.createRefund).not.toHaveBeenCalled();
      expect(provider.refundPayment).not.toHaveBeenCalled();
    });

    it('rejects idempotency key reuse for a different order or amount', async () => {
      repository.findRefundByIdempotencyKey.mockResolvedValue(
        createRefundRecord({ amountMinor: 99 }),
      );
      await expect(service.createRefund(createAdmin(), dto, IDEMPOTENCY_KEY)).rejects.toThrow(
        IdempotencyKeyConflictException,
      );
    });
  });

  describe('assignSubscription', () => {
    it('assigns an active plan with a computed period, no payment involved', async () => {
      repository.findPlanById.mockResolvedValue(createPlanRecord());
      repository.assignSubscription.mockResolvedValue(createSubscriptionRecord());

      const result = await service.assignSubscription(createAdmin(), {
        organizationId: 'org-1',
        planId: 'plan-1',
        note: 'Comped for launch',
      });

      const call = repository.assignSubscription.mock.calls[0]?.[0] as {
        periodStart: Date;
        periodEnd: Date;
        note?: string;
      };
      const expectedEnd = new Date(call.periodStart);
      expectedEnd.setMonth(expectedEnd.getMonth() + 1);
      expect(call.periodEnd.getTime()).toBe(expectedEnd.getTime());
      expect(call.note).toBe('Comped for launch');
      expect(result.data.status).toBe('ACTIVE');
    });

    it('rejects assignment of inactive plans', async () => {
      repository.findPlanById.mockResolvedValue(createPlanRecord({ isActive: false }));
      await expect(
        service.assignSubscription(createAdmin(), {
          organizationId: 'org-1',
          planId: 'plan-1',
        }),
      ).rejects.toThrow(PlanNotFoundException);
    });
  });

  describe('retryOrder', () => {
    it('refuses to retry a paid order', async () => {
      repository.findOrderById.mockResolvedValue(createOrderRecord({ status: 'PAID' }));
      await expect(
        service.retryOrder(createAdmin(), 'order-1', { organizationId: 'org-1' }, IDEMPOTENCY_KEY),
      ).rejects.toThrow(InvalidOrderStateException);
    });

    it('issues a fresh provider order without changing totals', async () => {
      const failedOrder = createOrderRecord({ status: 'FAILED' });
      repository.findOrderById.mockResolvedValue(failedOrder);
      provider.createOrder.mockResolvedValue({
        id: 'order_rzp2',
        amount: 50_000,
        currency: 'INR',
        receipt: 'rcpt_abc',
        status: 'created',
      });
      repository.attachProviderOrder.mockResolvedValue(
        createOrderRecord({ providerOrderId: 'order_rzp2', status: 'CREATED' }),
      );

      const result = await service.retryOrder(
        createAdmin(),
        'order-1',
        { organizationId: 'org-1' },
        IDEMPOTENCY_KEY,
      );

      expect(provider.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50_000, currency: 'INR' }),
      );
      expect(result.data.providerOrderId).toBe('order_rzp2');
      expect(result.data.totalMinor).toBe(50_000);
      expect(repository.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'payment.order.retry' }),
      );
    });
  });

  describe('plans and coupons', () => {
    it('maps unique-constraint violations to a plan conflict', async () => {
      repository.createPlan.mockRejectedValue({ code: 'P2002' });
      await expect(
        service.createPlan(createAdmin(), {
          organizationId: 'org-1',
          name: 'Basic',
          priceMinor: 99_900,
          currency: 'INR',
          interval: 'MONTHLY',
        }),
      ).rejects.toThrow(PlanConflictException);
    });

    it('converts percent coupons to basis points', async () => {
      repository.createCoupon.mockImplementation((data: { percentOffBps?: number }) =>
        Promise.resolve({
          ...createRefundRecord(),
          ...data,
          id: 'coupon-1',
          code: 'SAVE15',
          name: 'SAVE15',
          description: null,
          type: 'PERCENTAGE' as const,
          amountOffMinor: null,
          percentOffBps: data.percentOffBps ?? null,
          currency: null,
          minimumOrderMinor: null,
          maximumDiscountMinor: null,
          maxRedemptions: null,
          redemptionCount: 0,
          startsAt: null,
          expiresAt: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.createCoupon(createAdmin(), {
        organizationId: 'org-1',
        code: 'SAVE15',
        discountType: 'percent',
        discountValue: 15,
      });

      expect(repository.createCoupon).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PERCENTAGE', percentOffBps: 1_500 }),
      );
      expect(result.data.discountType).toBe('percent');
      expect(result.data.discountValue).toBe(15);
    });
  });
});
