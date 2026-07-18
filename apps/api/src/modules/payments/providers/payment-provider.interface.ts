export interface ProviderOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}

export interface ProviderOrder {
  id: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  receipt: string | null;
  status: string;
  attempts: number;
  createdAt: Date;
}

export interface ProviderPayment {
  id: string;
  orderId: string | null;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  method: string | null;
  email: string | null;
  contact: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  cardLast4: string | null;
  cardNetwork: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  createdAt: Date;
}

export interface ProviderRefundRequest {
  paymentId: string;
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}

export interface ProviderRefund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

export interface CheckoutSignatureInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentProvider {
  readonly name: 'RAZORPAY';
  isConfigured(): boolean;
  getPublicKeyId(): string | null;
  createOrder(request: ProviderOrderRequest): Promise<ProviderOrder>;
  getPayment(paymentId: string): Promise<ProviderPayment>;
  refundPayment(request: ProviderRefundRequest): Promise<ProviderRefund>;
  verifyCheckoutSignature(input: CheckoutSignatureInput): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}
