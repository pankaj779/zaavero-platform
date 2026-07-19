import * as WebBrowser from 'expo-web-browser';
import { PaymentsApi, type PaymentOrderRecord } from '../api/endpoints';

export interface CheckoutInput {
  organizationId: string;
  planId?: string;
  courseId?: string;
  amount?: number;
}

export interface CheckoutResult {
  order: PaymentOrderRecord;
  config: { provider: string; keyId?: string | null; currency?: string };
}

/**
 * Reuses the existing Razorpay backend: fetches config, creates an order through
 * the shared /payments endpoints, and (when the provider returns a hosted
 * payment link) opens it in a secure in-app browser. Verification is delegated
 * back to the backend /payments/verify endpoint — no payment logic is forked.
 *
 * For a fully native card sheet, wrap this with `react-native-razorpay` using
 * `config.keyId` and `order.providerOrderId`; the create/verify contract is
 * already satisfied here.
 */
export const checkout = {
  async createOrder(input: CheckoutInput): Promise<CheckoutResult> {
    const [config, order] = await Promise.all([
      PaymentsApi.config(),
      PaymentsApi.createOrder(input),
    ]);
    return { order, config };
  },

  async openHostedCheckout(url: string): Promise<'completed' | 'dismissed'> {
    const result = await WebBrowser.openBrowserAsync(url);
    return result.type === 'opened' ? 'completed' : 'dismissed';
  },

  verify(payload: Record<string, unknown>): Promise<PaymentOrderRecord> {
    return PaymentsApi.verify(payload);
  },
};
