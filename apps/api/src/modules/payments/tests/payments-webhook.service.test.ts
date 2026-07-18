import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidWebhookSignatureException } from '../exceptions';
import {
  PaymentsWebhookService,
  sanitizeWebhookPayload,
} from '../services/payments-webhook.service';
import {
  createOrderRecord,
  createPaymentRecord,
  createProviderMock,
  createRefundRecord,
  createRepositoryMock,
  type MockedProvider,
  type MockedRepository,
} from './payments-test.helpers';

function webhookBody(event: string, paymentOverrides: Record<string, unknown> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      event,
      payload: {
        payment: {
          entity: {
            id: 'pay_rzp1',
            order_id: 'order_rzp1',
            amount: 50_000,
            currency: 'INR',
            status: 'captured',
            captured: true,
            method: 'upi',
            vpa: 'student@upi',
            email: 'student@example.com',
            contact: '+911234567890',
            ...paymentOverrides,
          },
        },
      },
    }),
  );
}

describe('PaymentsWebhookService', () => {
  let repository: MockedRepository;
  let provider: MockedProvider;
  let service: PaymentsWebhookService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createRepositoryMock();
    provider = createProviderMock();
    service = new PaymentsWebhookService(repository, provider);
    repository.createPaymentEvent.mockResolvedValue({
      created: true,
      event: {
        id: 'event-1',
        provider: 'RAZORPAY',
        eventId: 'evt_1',
        type: 'PAYMENT_CAPTURED',
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        processedAt: null,
        receivedAt: new Date(),
      },
    });
    repository.updatePaymentEvent.mockResolvedValue(undefined);
  });

  it('rejects a missing signature before any parsing or storage', async () => {
    await expect(
      service.handleRazorpayWebhook(webhookBody('payment.captured'), undefined, 'evt_1'),
    ).rejects.toThrow(InvalidWebhookSignatureException);
    expect(repository.createPaymentEvent).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature before any parsing or storage', async () => {
    provider.verifyWebhookSignature.mockReturnValue(false);
    await expect(
      service.handleRazorpayWebhook(webhookBody('payment.captured'), 'bad-sig', 'evt_1'),
    ).rejects.toThrow(InvalidWebhookSignatureException);
    expect(repository.createPaymentEvent).not.toHaveBeenCalled();
  });

  it('acknowledges duplicate events without reprocessing', async () => {
    repository.createPaymentEvent.mockResolvedValue({
      created: false,
      event: {
        id: 'event-1',
        provider: 'RAZORPAY',
        eventId: 'evt_1',
        type: 'PAYMENT_CAPTURED',
        status: 'PROCESSED',
        attempts: 1,
        lastError: null,
        processedAt: new Date(),
        receivedAt: new Date(),
      },
    });

    const result = await service.handleRazorpayWebhook(
      webhookBody('payment.captured'),
      'sig',
      'evt_1',
    );

    expect(result).toEqual({ received: true, duplicate: true, processed: true });
    expect(repository.capturePayment).not.toHaveBeenCalled();
    expect(repository.updatePaymentEvent).not.toHaveBeenCalled();
  });

  it('captures the payment exactly once for payment.captured', async () => {
    repository.findOrderByProviderOrderId.mockResolvedValue(createOrderRecord());
    repository.capturePayment.mockResolvedValue({
      order: createOrderRecord({ status: 'PAID' }),
      payment: createPaymentRecord(),
      fulfilled: true,
      alreadyProcessed: false,
    });

    const result = await service.handleRazorpayWebhook(
      webhookBody('payment.captured'),
      'sig',
      'evt_1',
    );

    expect(repository.capturePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        providerPaymentId: 'pay_rzp1',
        amountMinor: 50_000,
        captured: true,
        actorUserId: null,
      }),
    );
    expect(repository.updatePaymentEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({ status: 'PROCESSED', orderId: 'order-1' }),
    );
    expect(result.processed).toBe(true);
  });

  it('stores sanitized payloads without contact details', async () => {
    repository.findOrderByProviderOrderId.mockResolvedValue(createOrderRecord());
    repository.capturePayment.mockResolvedValue({
      order: createOrderRecord({ status: 'PAID' }),
      payment: createPaymentRecord(),
      fulfilled: true,
      alreadyProcessed: false,
    });

    await service.handleRazorpayWebhook(webhookBody('payment.captured'), 'sig', 'evt_1');

    const storedPayload = repository.createPaymentEvent.mock.calls[0]?.[0] as {
      payload: {
        payload: { payment: { entity: Record<string, unknown> } };
      };
      signatureHash: string;
    };
    const entity = storedPayload.payload.payload.payment.entity;
    expect(entity.email).toBe('***');
    expect(entity.contact).toBe('***');
    expect(entity.vpa).toBe('***');
    // The raw signature is never stored — only its hash.
    expect(storedPayload.signatureHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('marks the event failed (but still acks) when webhook amounts mismatch', async () => {
    repository.findOrderByProviderOrderId.mockResolvedValue(
      createOrderRecord({ totalMinor: 99_999 }),
    );

    const result = await service.handleRazorpayWebhook(
      webhookBody('payment.captured'),
      'sig',
      'evt_1',
    );

    expect(result.processed).toBe(false);
    expect(repository.capturePayment).not.toHaveBeenCalled();
    expect(repository.updatePaymentEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('ignores events for unknown provider orders', async () => {
    repository.findOrderByProviderOrderId.mockResolvedValue(null);

    const result = await service.handleRazorpayWebhook(
      webhookBody('payment.captured'),
      'sig',
      'evt_1',
    );

    expect(result.processed).toBe(false);
    expect(repository.updatePaymentEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({ status: 'IGNORED' }),
    );
  });

  it('records failures for payment.failed without regressing paid orders', async () => {
    repository.findOrderByProviderOrderId.mockResolvedValue(createOrderRecord());
    repository.recordPaymentFailure.mockResolvedValue(createPaymentRecord({ status: 'FAILED' }));

    const result = await service.handleRazorpayWebhook(
      webhookBody('payment.failed', {
        status: 'failed',
        captured: false,
        error_code: 'BAD_REQUEST_ERROR',
        error_description: 'Payment declined',
      }),
      'sig',
      'evt_1',
    );

    expect(repository.recordPaymentFailure).toHaveBeenCalledWith(
      expect.objectContaining({ failureCode: 'BAD_REQUEST_ERROR' }),
    );
    expect(result.processed).toBe(true);
  });

  it('finalizes refunds from refund.processed events', async () => {
    const refundBody = Buffer.from(
      JSON.stringify({
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_1',
              payment_id: 'pay_rzp1',
              amount: 10_000,
              currency: 'INR',
              status: 'processed',
              notes: { refundId: 'refund-1' },
            },
          },
        },
      }),
    );
    repository.findRefundByProviderRefundId.mockResolvedValue(null);
    repository.findRefundById.mockResolvedValue(createRefundRecord());
    repository.finalizeRefund.mockResolvedValue(
      createRefundRecord({ status: 'PROCESSED', providerRefundId: 'rfnd_1' }),
    );

    const result = await service.handleRazorpayWebhook(refundBody, 'sig', 'evt_2');

    expect(repository.finalizeRefund).toHaveBeenCalledWith(
      expect.objectContaining({ refundId: 'refund-1', status: 'PROCESSED' }),
    );
    expect(result.processed).toBe(true);
  });
});

describe('sanitizeWebhookPayload', () => {
  it('masks sensitive keys recursively and preserves structure', () => {
    const sanitized = sanitizeWebhookPayload({
      event: 'payment.captured',
      nested: [{ email: 'a@b.c', token: 'tok_123', amount: 5 }],
      card: { last4: '4242', network: 'Visa' },
    }) as Record<string, unknown>;

    expect(sanitized.event).toBe('payment.captured');
    expect((sanitized.nested as Record<string, unknown>[])[0]).toEqual({
      email: '***',
      token: '***',
      amount: 5,
    });
    expect(sanitized.card).toEqual({ last4: '4242', network: 'Visa' });
  });
});
