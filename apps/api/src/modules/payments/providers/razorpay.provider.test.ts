import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { EnvConfig } from '../../../config/env.schema';
import { RazorpayProvider } from './razorpay.provider';

function createProvider(config: Partial<EnvConfig>): RazorpayProvider {
  return new RazorpayProvider(
    new ConfigService<EnvConfig, true>({
      RAZORPAY_API_URL: 'https://api.razorpay.com/v1',
      ...config,
    }),
  );
}

describe('RazorpayProvider', () => {
  it('reports whether credentials are configured without exposing the secret', () => {
    const configured = createProvider({
      RAZORPAY_KEY_ID: 'rzp_test_key',
      RAZORPAY_SECRET: 'secret',
    });
    const unconfigured = createProvider({});

    expect(configured.isConfigured()).toBe(true);
    expect(configured.getPublicKeyId()).toBe('rzp_test_key');
    expect(unconfigured.isConfigured()).toBe(false);
    expect(unconfigured.getPublicKeyId()).toBeNull();
  });

  it('verifies checkout signatures using the provider order and payment ids', () => {
    const provider = createProvider({ RAZORPAY_SECRET: 'checkout-secret' });
    const signature = createHmac('sha256', 'checkout-secret')
      .update('order_123|pay_123')
      .digest('hex');

    expect(
      provider.verifyCheckoutSignature({
        providerOrderId: 'order_123',
        providerPaymentId: 'pay_123',
        signature,
      }),
    ).toBe(true);
    expect(
      provider.verifyCheckoutSignature({
        providerOrderId: 'order_123',
        providerPaymentId: 'pay_123',
        signature: `${signature.slice(0, -1)}0`,
      }),
    ).toBe(false);
  });

  it('verifies webhook signatures against the untouched raw request body', () => {
    const provider = createProvider({ RAZORPAY_WEBHOOK_SECRET: 'webhook-secret' });
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = createHmac('sha256', 'webhook-secret').update(body).digest('hex');

    expect(provider.verifyWebhookSignature(body, signature)).toBe(true);
    expect(provider.verifyWebhookSignature(Buffer.from('{}'), signature)).toBe(false);
  });
});
