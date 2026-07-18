import { createHmac, timingSafeEqual } from 'node:crypto';
import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import type {
  CheckoutSignatureInput,
  PaymentProvider,
  ProviderOrder,
  ProviderOrderRequest,
  ProviderPayment,
  ProviderRefund,
  ProviderRefundRequest,
} from './payment-provider.interface';

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string | null;
  status: string;
  attempts: number;
  created_at: number;
}

interface RazorpayPaymentResponse {
  id: string;
  order_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  method?: string | null;
  email?: string | null;
  contact?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  card?: {
    last4?: string | null;
    network?: string | null;
  } | null;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
}

interface RazorpayRefundResponse {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: number;
}

@Injectable()
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'RAZORPAY' as const;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  isConfigured(): boolean {
    return this.getCredentials() !== null;
  }

  getPublicKeyId(): string | null {
    return this.configService.get('RAZORPAY_KEY_ID', { infer: true }) ?? null;
  }

  async createOrder(request: ProviderOrderRequest): Promise<ProviderOrder> {
    const response = await this.request<RazorpayOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        receipt: request.receipt,
        notes: request.notes,
      }),
    });

    return {
      id: response.id,
      amount: response.amount,
      amountPaid: response.amount_paid,
      amountDue: response.amount_due,
      currency: response.currency,
      receipt: response.receipt ?? null,
      status: response.status,
      attempts: response.attempts,
      createdAt: new Date(response.created_at * 1000),
    };
  }

  async getPayment(paymentId: string): Promise<ProviderPayment> {
    const response = await this.request<RazorpayPaymentResponse>(
      `/payments/${encodeURIComponent(paymentId)}`,
      { method: 'GET' },
    );

    return {
      id: response.id,
      orderId: response.order_id ?? null,
      amount: response.amount,
      currency: response.currency,
      status: response.status,
      captured: response.captured,
      method: response.method ?? null,
      email: response.email ?? null,
      contact: response.contact ?? null,
      bank: response.bank ?? null,
      wallet: response.wallet ?? null,
      vpa: response.vpa ?? null,
      cardLast4: response.card?.last4 ?? null,
      cardNetwork: response.card?.network ?? null,
      errorCode: response.error_code ?? null,
      errorDescription: response.error_description ?? null,
      createdAt: new Date(response.created_at * 1000),
    };
  }

  async refundPayment(request: ProviderRefundRequest): Promise<ProviderRefund> {
    const response = await this.request<RazorpayRefundResponse>(
      `/payments/${encodeURIComponent(request.paymentId)}/refund`,
      {
        method: 'POST',
        body: JSON.stringify({
          amount: request.amount,
          receipt: request.receipt,
          notes: request.notes,
        }),
      },
    );

    return {
      id: response.id,
      paymentId: response.payment_id,
      amount: response.amount,
      currency: response.currency,
      status: response.status,
      createdAt: new Date(response.created_at * 1000),
    };
  }

  verifyCheckoutSignature(input: CheckoutSignatureInput): boolean {
    const secret = this.configService.get('RAZORPAY_SECRET', { infer: true });
    if (!secret) {
      return false;
    }

    const expected = createHmac('sha256', secret)
      .update(`${input.providerOrderId}|${input.providerPaymentId}`)
      .digest('hex');
    return this.safeCompare(expected, input.signature);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET', { infer: true });
    if (!secret) {
      return false;
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeCompare(expected, signature);
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET.',
      );
    }

    const baseUrl = this.configService.get('RAZORPAY_API_URL', { infer: true });
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${credentials.keyId}:${credentials.secret}`,
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new BadGatewayException('Razorpay could not be reached.');
    }

    if (!response.ok) {
      const requestId = response.headers.get('x-razorpay-request-id');
      throw new BadGatewayException(
        requestId
          ? `Razorpay rejected the request (request ${requestId}).`
          : 'Razorpay rejected the request.',
      );
    }

    return (await response.json()) as T;
  }

  private getCredentials(): { keyId: string; secret: string } | null {
    const keyId = this.configService.get('RAZORPAY_KEY_ID', { infer: true });
    const secret = this.configService.get('RAZORPAY_SECRET', { infer: true });
    return keyId && secret ? { keyId, secret } : null;
  }

  private safeCompare(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(received, 'utf8');
    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }
}
