import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  PAYMENT_REPOSITORY,
  type PaymentEventTypeValue,
} from '../constants/payment.constants';
import type { WebhookAckResponseDto } from '../dto/payment-response.dto';
import { InvalidOrderRequestException, InvalidWebhookSignatureException } from '../exceptions';
import type {
  PaymentsRepository,
  UpdatePaymentEventData,
} from '../interfaces/payments-repository.interface';
import type { PaymentProvider } from '../providers/payment-provider.interface';
import { toSafePaymentMethod } from './payment-shared';

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  method?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  card?: { last4?: string | null; network?: string | null } | null;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  error_reason?: string | null;
}

interface RazorpayRefundEntity {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string> | null;
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    refund?: { entity?: RazorpayRefundEntity };
    order?: { entity?: { id?: string } };
  };
}

const EVENT_TYPE_MAP: Record<string, PaymentEventTypeValue> = {
  'payment.authorized': 'PAYMENT_AUTHORIZED',
  'payment.captured': 'PAYMENT_CAPTURED',
  'payment.failed': 'PAYMENT_FAILED',
  'order.paid': 'ORDER_PAID',
  'refund.created': 'REFUND_CREATED',
  'refund.processed': 'REFUND_PROCESSED',
  'refund.failed': 'REFUND_FAILED',
  'subscription.activated': 'SUBSCRIPTION_ACTIVATED',
  'subscription.charged': 'SUBSCRIPTION_CHARGED',
  'subscription.paused': 'SUBSCRIPTION_PAUSED',
  'subscription.cancelled': 'SUBSCRIPTION_CANCELLED',
};

const MASKED_KEYS = new Set([
  'email',
  'contact',
  'vpa',
  'token',
  'token_id',
  'card_id',
  'customer_id',
]);

/** Recursively masks contact/token fields; never stores raw payment identity data. */
export function sanitizeWebhookPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeWebhookPayload(item));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (MASKED_KEYS.has(key) && typeof entry === 'string' && entry.length > 0) {
        result[key] = '***';
      } else {
        result[key] = sanitizeWebhookPayload(entry);
      }
    }
    return result;
  }
  return value;
}

@Injectable()
export class PaymentsWebhookService {
  private readonly logger = new Logger(PaymentsWebhookService.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PaymentsRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProvider,
  ) {}

  /**
   * Handles a Razorpay webhook. The signature MUST be verified against the
   * untouched raw body before this method parses or processes anything.
   */
  async handleRazorpayWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    eventIdHeader: string | undefined,
  ): Promise<WebhookAckResponseDto> {
    if (!signature || signature.trim().length === 0) {
      throw new InvalidWebhookSignatureException('The webhook signature is missing.');
    }
    if (!this.provider.verifyWebhookSignature(rawBody, signature)) {
      throw new InvalidWebhookSignatureException();
    }

    let body: RazorpayWebhookBody;
    try {
      body = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookBody;
    } catch {
      throw new InvalidOrderRequestException('The webhook payload is not valid JSON.');
    }

    const eventName = body.event ?? 'unknown';
    const type = EVENT_TYPE_MAP[eventName] ?? 'OTHER';
    // Razorpay sends a unique event id header; fall back to a body digest so
    // replayed deliveries without the header still deduplicate.
    const eventId =
      eventIdHeader?.trim() ?? `sha256:${createHash('sha256').update(rawBody).digest('hex')}`;
    const signatureHash = createHash('sha256').update(signature).digest('hex');

    const { created, event } = await this.repository.createPaymentEvent({
      provider: this.provider.name,
      eventId,
      type,
      payload: sanitizeWebhookPayload(body),
      signatureHash,
    });

    // Exactly-once: a previously processed or ignored event is acknowledged
    // without reprocessing. PENDING/FAILED events are replay-safe to re-run.
    if (!created && (event.status === 'PROCESSED' || event.status === 'IGNORED')) {
      return { received: true, duplicate: true, processed: event.status === 'PROCESSED' };
    }

    try {
      const outcome = await this.processEvent(type, body, event.id);
      await this.repository.updatePaymentEvent(event.id, {
        status: outcome.ignored ? 'IGNORED' : 'PROCESSED',
        processedAt: new Date(),
        lastError: null,
        ...outcome.links,
      });
      return { received: true, duplicate: !created, processed: !outcome.ignored };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook ${eventName} (${eventId}) failed: ${message}`);
      await this.repository.updatePaymentEvent(event.id, {
        status: 'FAILED',
        lastError: message.slice(0, 1_000),
      });
      // Acknowledge receipt; the stored FAILED event enables replay/alerting
      // without triggering unbounded provider retries.
      return { received: true, duplicate: false, processed: false };
    }
  }

  private async processEvent(
    type: PaymentEventTypeValue,
    body: RazorpayWebhookBody,
    paymentEventId: string,
  ): Promise<{ ignored: boolean; links: Partial<UpdatePaymentEventData> }> {
    switch (type) {
      case 'PAYMENT_AUTHORIZED':
      case 'PAYMENT_CAPTURED':
      case 'ORDER_PAID':
        return this.processPaymentEvent(type, body, paymentEventId);
      case 'PAYMENT_FAILED':
        return this.processPaymentFailure(body);
      case 'REFUND_PROCESSED':
      case 'REFUND_FAILED':
        return this.processRefundEvent(type, body);
      default:
        return { ignored: true, links: {} };
    }
  }

  private async processPaymentEvent(
    type: PaymentEventTypeValue,
    body: RazorpayWebhookBody,
    paymentEventId: string,
  ): Promise<{ ignored: boolean; links: Partial<UpdatePaymentEventData> }> {
    const payment = body.payload?.payment?.entity;
    if (!payment?.order_id) {
      return { ignored: true, links: {} };
    }

    const order = await this.repository.findOrderByProviderOrderId(
      this.provider.name,
      payment.order_id,
    );
    if (!order) {
      // Not one of ours (e.g. shared Razorpay account) — record and ignore.
      return { ignored: true, links: {} };
    }

    // Amount authority: the webhook payment must match the local order.
    if (
      payment.amount !== order.totalMinor ||
      payment.currency.toUpperCase() !== order.currency.toUpperCase()
    ) {
      throw new Error(`Webhook payment ${payment.id} does not match order ${order.id} totals`);
    }

    const captured =
      type !== 'PAYMENT_AUTHORIZED' || payment.captured === true || payment.status === 'captured';

    const result = await this.repository.capturePayment({
      orderId: order.id,
      organizationId: order.organizationId,
      customerId: order.customerId,
      provider: this.provider.name,
      providerPaymentId: payment.id,
      providerOrderId: payment.order_id,
      amountMinor: payment.amount,
      currency: payment.currency.toUpperCase(),
      captured,
      paymentMethod: toSafePaymentMethod({
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        captured: payment.captured ?? false,
        method: payment.method ?? null,
        email: null,
        contact: null,
        bank: payment.bank ?? null,
        wallet: payment.wallet ?? null,
        vpa: payment.vpa ?? null,
        cardLast4: payment.card?.last4 ?? null,
        cardNetwork: payment.card?.network ?? null,
        errorCode: null,
        errorDescription: null,
        createdAt: new Date(),
      }),
      actorUserId: null,
      paymentEventId,
    });

    return {
      ignored: false,
      links: {
        organizationId: order.organizationId,
        orderId: order.id,
        paymentId: result.payment.id,
      },
    };
  }

  private async processPaymentFailure(
    body: RazorpayWebhookBody,
  ): Promise<{ ignored: boolean; links: Partial<UpdatePaymentEventData> }> {
    const payment = body.payload?.payment?.entity;
    if (!payment?.order_id) {
      return { ignored: true, links: {} };
    }

    const order = await this.repository.findOrderByProviderOrderId(
      this.provider.name,
      payment.order_id,
    );
    if (!order) {
      return { ignored: true, links: {} };
    }

    const record = await this.repository.recordPaymentFailure({
      organizationId: order.organizationId,
      orderId: order.id,
      customerId: order.customerId,
      provider: this.provider.name,
      providerPaymentId: payment.id,
      providerOrderId: payment.order_id,
      amountMinor: payment.amount,
      currency: payment.currency.toUpperCase(),
      failureCode: payment.error_code ?? undefined,
      failureDescription: payment.error_description ?? undefined,
      failureSource: payment.error_source ?? undefined,
      failureStep: payment.error_step ?? undefined,
      failureReason: payment.error_reason ?? undefined,
    });

    return {
      ignored: false,
      links: {
        organizationId: order.organizationId,
        orderId: order.id,
        paymentId: record.id,
      },
    };
  }

  private async processRefundEvent(
    type: PaymentEventTypeValue,
    body: RazorpayWebhookBody,
  ): Promise<{ ignored: boolean; links: Partial<UpdatePaymentEventData> }> {
    const refundEntity = body.payload?.refund?.entity;
    if (!refundEntity) {
      return { ignored: true, links: {} };
    }

    // Match by provider refund id first, then by our notes.refundId.
    let refund = await this.repository.findRefundByProviderRefundId(
      this.provider.name,
      refundEntity.id,
    );
    if (!refund && refundEntity.notes?.refundId) {
      refund = await this.repository.findRefundById(refundEntity.notes.refundId);
    }
    if (!refund) {
      return { ignored: true, links: {} };
    }

    const processed = type === 'REFUND_PROCESSED';
    const finalized = await this.repository.finalizeRefund({
      refundId: refund.id,
      status: processed ? 'PROCESSED' : 'FAILED',
      providerRefundId: refundEntity.id,
      processedAt: processed ? new Date() : undefined,
      failureReason: processed ? undefined : 'Provider reported refund failure',
      actorUserId: null,
    });

    return {
      ignored: false,
      links: {
        organizationId: finalized.organizationId,
        orderId: finalized.orderId,
        refundId: finalized.id,
      },
    };
  }
}
