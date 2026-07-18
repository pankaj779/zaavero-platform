import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfEntityNotFoundException } from '../exceptions';
import { PdfService } from '../services/pdf.service';
import { QrService } from '../services/qr.service';
import {
  CERT_ID,
  INVOICE_ID,
  PAYMENT_ID,
  REFUND_ID,
  asPrismaClient,
  asStorageService,
  certificateRow,
  createConfig,
  createPdfProviderMock,
  createPrismaMock,
  createStorageMock,
  invoiceRow,
  paymentRow,
  refundRow,
  type PrismaMock,
  type ProviderMock,
  type StorageMock,
} from './pdf-test.helpers';

describe('PdfService', () => {
  let prisma: PrismaMock;
  let storage: StorageMock;
  let provider: ProviderMock;
  let service: PdfService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    storage = createStorageMock();
    provider = createPdfProviderMock();
    service = new PdfService(
      asPrismaClient(prisma),
      provider,
      asStorageService(storage),
      new QrService(createConfig()),
    );
  });

  describe('ensureCertificatePdf', () => {
    it('generates QR + PDF, stores both, claims the URL, and audits', async () => {
      prisma.certificate.findUnique.mockResolvedValue(certificateRow());
      prisma.certificate.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.ensureCertificatePdf(CERT_ID, { actorUserId: 'admin-1' });

      expect(result.generated).toBe(true);
      expect(result.url).toBe('https://cdn.storage.test/generated.pdf');
      // One upload for the QR PNG, one for the certificate PDF.
      expect(storage.uploadGeneratedAsset).toHaveBeenCalledTimes(2);
      expect(storage.uploadGeneratedAsset).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'CERTIFICATE_QR', mimeType: 'image/png' }),
      );
      expect(storage.uploadGeneratedAsset).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'CERTIFICATE_PDF', mimeType: 'application/pdf' }),
      );
      expect(provider.render).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'certificate' }),
      );
      expect(prisma.certificate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CERT_ID, pdfUrl: null } }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'pdf.certificate.generated',
            entity: 'Certificate',
            userId: 'admin-1',
          }) as object,
        }),
      );
    });

    it('is idempotent: skips generation when a PDF URL already exists', async () => {
      prisma.certificate.findUnique.mockResolvedValue(
        certificateRow({ pdfUrl: 'https://cdn.storage.test/existing.pdf' }),
      );

      const result = await service.ensureCertificatePdf(CERT_ID);

      expect(result).toEqual({
        url: 'https://cdn.storage.test/existing.pdf',
        sizeBytes: 0,
        generated: false,
      });
      expect(provider.render).not.toHaveBeenCalled();
      expect(storage.uploadGeneratedAsset).not.toHaveBeenCalled();
    });

    it('regenerates when force is set and writes a regeneration audit entry', async () => {
      prisma.certificate.findUnique.mockResolvedValue(
        certificateRow({ pdfUrl: 'https://cdn.storage.test/existing.pdf' }),
      );
      prisma.certificate.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.ensureCertificatePdf(CERT_ID, { force: true });

      expect(result.generated).toBe(true);
      expect(prisma.certificate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CERT_ID } }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'pdf.certificate.regenerated' }) as object,
        }),
      );
    });

    it('yields to a concurrent generator that claimed the URL first', async () => {
      prisma.certificate.findUnique
        .mockResolvedValueOnce(certificateRow())
        .mockResolvedValueOnce({ pdfUrl: 'https://cdn.storage.test/winner.pdf' });
      prisma.certificate.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.ensureCertificatePdf(CERT_ID);

      expect(result).toEqual({
        url: 'https://cdn.storage.test/winner.pdf',
        sizeBytes: 0,
        generated: false,
      });
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('throws when the certificate does not exist', async () => {
      prisma.certificate.findUnique.mockResolvedValue(null);

      await expect(service.ensureCertificatePdf(CERT_ID)).rejects.toBeInstanceOf(
        PdfEntityNotFoundException,
      );
    });
  });

  describe('ensureInvoicePdf', () => {
    it('renders and stores the invoice PDF once', async () => {
      prisma.invoice.findUnique.mockResolvedValue(invoiceRow());
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.ensureInvoicePdf(INVOICE_ID);

      expect(result.generated).toBe(true);
      expect(provider.render).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'invoice',
          data: expect.objectContaining({
            invoiceNumber: 'INV-202606-ABCDE12345',
            paymentReference: 'pay_rzp1',
          }) as object,
        }),
      );
      expect(storage.uploadGeneratedAsset).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'INVOICE_PDF' }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'pdf.invoice.generated' }) as object,
        }),
      );
    });

    it('skips when the invoice already has a PDF', async () => {
      prisma.invoice.findUnique.mockResolvedValue(
        invoiceRow({ pdfUrl: 'https://cdn.storage.test/inv.pdf' }),
      );

      const result = await service.ensureInvoicePdf(INVOICE_ID);

      expect(result.generated).toBe(false);
      expect(provider.render).not.toHaveBeenCalled();
    });

    it('resolves the invoice from an order id', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({ id: INVOICE_ID })
        .mockResolvedValueOnce(invoiceRow({ pdfUrl: 'https://cdn.storage.test/inv.pdf' }));

      const result = await service.ensureInvoicePdfByOrderId('order-1');

      expect(result?.url).toBe('https://cdn.storage.test/inv.pdf');
    });

    it('returns null when the order has no invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.ensureInvoicePdfByOrderId('order-x')).resolves.toBeNull();
    });
  });

  describe('ensurePaymentReceiptPdf', () => {
    it('renders and stores the payment receipt once', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentRow());
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.ensurePaymentReceiptPdf(PAYMENT_ID);

      expect(result.generated).toBe(true);
      expect(provider.render).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'payment_receipt',
          data: expect.objectContaining({
            kind: 'PAYMENT',
            transactionReference: 'pay_rzp1',
          }) as object,
        }),
      );
      expect(storage.uploadGeneratedAsset).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'PAYMENT_RECEIPT_PDF' }),
      );
    });

    it('skips when the receipt already exists', async () => {
      prisma.payment.findUnique.mockResolvedValue(
        paymentRow({ receiptPdfUrl: 'https://cdn.storage.test/receipt.pdf' }),
      );

      const result = await service.ensurePaymentReceiptPdf(PAYMENT_ID);

      expect(result.generated).toBe(false);
      expect(storage.uploadGeneratedAsset).not.toHaveBeenCalled();
    });
  });

  describe('ensureRefundReceiptPdf', () => {
    it('renders and stores the refund receipt once', async () => {
      prisma.refund.findUnique.mockResolvedValue(refundRow());
      prisma.refund.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.ensureRefundReceiptPdf(REFUND_ID);

      expect(result.generated).toBe(true);
      expect(provider.render).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'refund_receipt',
          data: expect.objectContaining({
            kind: 'REFUND',
            reason: 'Requested by student',
          }) as object,
        }),
      );
      expect(storage.uploadGeneratedAsset).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'REFUND_RECEIPT_PDF' }),
      );
    });

    it('skips when the refund receipt already exists', async () => {
      prisma.refund.findUnique.mockResolvedValue(
        refundRow({ receiptPdfUrl: 'https://cdn.storage.test/refund.pdf' }),
      );

      const result = await service.ensureRefundReceiptPdf(REFUND_ID);

      expect(result.generated).toBe(false);
      expect(provider.render).not.toHaveBeenCalled();
    });
  });
});
