export const PDF_TEMPLATE_NAMES = [
  'certificate',
  'invoice',
  'payment_receipt',
  'refund_receipt',
] as const;

export type PdfTemplateName = (typeof PDF_TEMPLATE_NAMES)[number];

export interface CertificateTemplateData {
  organizationName: string;
  studentName: string;
  courseName: string;
  teacherName: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  completedAt: Date | null;
  issuedAt: Date;
  qrPng: Buffer;
}

export interface InvoiceTemplateData {
  organizationName: string;
  organizationAddress: string | null;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  invoiceNumber: string;
  paymentReference: string | null;
  itemDescription: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  status: string;
  issuedAt: Date;
}

export interface ReceiptTemplateData {
  kind: 'PAYMENT' | 'REFUND';
  organizationName: string;
  customerName: string;
  customerEmail: string;
  reference: string;
  orderReference: string;
  transactionReference: string | null;
  method: string;
  amountMinor: number;
  currency: string;
  status: string;
  date: Date;
  reason?: string | null;
}

export interface PdfTemplateDataMap {
  certificate: CertificateTemplateData;
  invoice: InvoiceTemplateData;
  payment_receipt: ReceiptTemplateData;
  refund_receipt: ReceiptTemplateData;
}

export interface PdfRenderRequest<T extends PdfTemplateName = PdfTemplateName> {
  template: T;
  data: PdfTemplateDataMap[T];
}

export interface PdfProvider {
  render<T extends PdfTemplateName>(request: PdfRenderRequest<T>): Promise<Buffer>;
}

export interface EnsurePdfOptions {
  force?: boolean;
  actorUserId?: string | null;
}

export interface GeneratedPdfResult {
  url: string;
  sizeBytes: number;
  generated: boolean;
}
