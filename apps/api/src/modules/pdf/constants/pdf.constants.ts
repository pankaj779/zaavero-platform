export const PDF_LIB = Symbol('PDF_LIB');

export const PDF_AUDIT_ACTIONS = {
  certificateGenerated: 'pdf.certificate.generated',
  certificateRegenerated: 'pdf.certificate.regenerated',
  invoiceGenerated: 'pdf.invoice.generated',
  invoiceRegenerated: 'pdf.invoice.regenerated',
  paymentReceiptGenerated: 'pdf.payment_receipt.generated',
  paymentReceiptRegenerated: 'pdf.payment_receipt.regenerated',
  refundReceiptGenerated: 'pdf.refund_receipt.generated',
  refundReceiptRegenerated: 'pdf.refund_receipt.regenerated',
} as const;
