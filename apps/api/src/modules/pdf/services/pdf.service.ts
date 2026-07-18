import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import { StorageService } from '../../storage/services/storage.service';
import { PDF_AUDIT_ACTIONS, PDF_LIB } from '../constants/pdf.constants';
import { PdfEntityNotFoundException } from '../exceptions';
import type {
  EnsurePdfOptions,
  GeneratedPdfResult,
  PdfProvider,
  ReceiptTemplateData,
} from '../interfaces/pdf.types';
import { QrService } from './qr.service';

interface BillingAddressSnapshot {
  fullName?: string;
  email?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
}

function fullName(user: { firstName: string; lastName: string; email: string }): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

function describeOrderSnapshot(order: {
  purpose: string;
  courseTitleSnapshot: string | null;
  batchNameSnapshot: string | null;
  planNameSnapshot: string | null;
}): string {
  if (order.purpose === 'COURSE_PURCHASE') {
    const title = order.courseTitleSnapshot ?? 'Course';
    return order.batchNameSnapshot ? `${title} — ${order.batchNameSnapshot}` : title;
  }
  return order.planNameSnapshot ? `${order.planNameSnapshot} subscription` : 'Subscription';
}

function billingAddressLine(snapshot: unknown): string {
  if (snapshot === null || typeof snapshot !== 'object') return '—';
  const address = snapshot as BillingAddressSnapshot;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.countryCode,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);
  if (parts.length === 0) return address.email ?? '—';
  return parts.join(', ');
}

/**
 * Centralized generation of certificate, invoice, and receipt PDFs.
 *
 * All ensure* methods are idempotent: an already-stored URL short-circuits
 * unless `force` is set, and the final claim is a conditional update so a
 * concurrent generator loses gracefully and reuses the winner's URL.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @Inject(PDF_LIB) private readonly provider: PdfProvider,
    private readonly storage: StorageService,
    private readonly qr: QrService,
  ) {}

  // ── Certificates ─────────────────────────────────────────────────────────

  async ensureCertificatePdf(
    certificateId: string,
    options: EnsurePdfOptions = {},
  ): Promise<GeneratedPdfResult> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      select: {
        id: true,
        organizationId: true,
        certificateNumber: true,
        verificationCode: true,
        pdfUrl: true,
        completedAt: true,
        issuedAt: true,
        organization: { select: { name: true } },
        student: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        course: {
          select: {
            title: true,
            teacher: {
              select: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
    });
    if (!certificate) throw new PdfEntityNotFoundException('Certificate');
    if (certificate.pdfUrl && !options.force) {
      return { url: certificate.pdfUrl, sizeBytes: 0, generated: false };
    }

    const qrPng = await this.qr.certificateQrPng(certificate.verificationCode);
    const qrAsset = await this.storage.uploadGeneratedAsset({
      organizationId: certificate.organizationId,
      ownerUserId: certificate.student.userId,
      entityType: 'CERTIFICATE_QR',
      entityId: certificate.id,
      filename: `certificate-${certificate.certificateNumber}-qr.png`,
      mimeType: 'image/png',
      buffer: qrPng,
    });

    const pdfBuffer = await this.provider.render({
      template: 'certificate',
      data: {
        organizationName: certificate.organization.name,
        studentName: fullName(certificate.student.user),
        courseName: certificate.course.title,
        teacherName: fullName(certificate.course.teacher.user),
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
        verificationUrl: this.qr.verificationUrl(certificate.verificationCode),
        completedAt: certificate.completedAt,
        issuedAt: certificate.issuedAt ?? new Date(),
        qrPng,
      },
    });
    const pdfAsset = await this.storage.uploadGeneratedAsset({
      organizationId: certificate.organizationId,
      ownerUserId: certificate.student.userId,
      entityType: 'CERTIFICATE_PDF',
      entityId: certificate.id,
      filename: `certificate-${certificate.certificateNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    const claimed = await this.prisma.certificate.updateMany({
      where: { id: certificate.id, ...(options.force ? {} : { pdfUrl: null }) },
      data: { pdfUrl: pdfAsset.url, qrImageUrl: qrAsset.url },
    });
    if (claimed.count === 0) {
      return this.concurrentWinnerUrl('Certificate', async () => {
        const row = await this.prisma.certificate.findUnique({
          where: { id: certificate.id },
          select: { pdfUrl: true },
        });
        return row?.pdfUrl ?? null;
      });
    }

    await this.audit(
      options.force
        ? PDF_AUDIT_ACTIONS.certificateRegenerated
        : PDF_AUDIT_ACTIONS.certificateGenerated,
      'Certificate',
      certificate.id,
      certificate.organizationId,
      pdfAsset.url,
      options,
    );
    return { url: pdfAsset.url, sizeBytes: pdfAsset.sizeBytes, generated: true };
  }

  // ── Invoices ─────────────────────────────────────────────────────────────

  async ensureInvoicePdfByOrderId(
    orderId: string,
    options: EnsurePdfOptions = {},
  ): Promise<GeneratedPdfResult | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (!invoice) return null;
    return this.ensureInvoicePdf(invoice.id, options);
  }

  async ensureInvoicePdf(
    invoiceId: string,
    options: EnsurePdfOptions = {},
  ): Promise<GeneratedPdfResult> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        organizationId: true,
        customerId: true,
        invoiceNumber: true,
        status: true,
        subtotalMinor: true,
        discountMinor: true,
        taxMinor: true,
        totalMinor: true,
        currency: true,
        billingAddressSnapshot: true,
        pdfUrl: true,
        issuedAt: true,
        createdAt: true,
        organization: { select: { name: true, address: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
        order: {
          select: {
            id: true,
            purpose: true,
            courseTitleSnapshot: true,
            batchNameSnapshot: true,
            planNameSnapshot: true,
            payments: {
              where: { status: 'CAPTURED' },
              orderBy: { capturedAt: 'desc' },
              take: 1,
              select: { providerPaymentId: true },
            },
          },
        },
      },
    });
    if (!invoice) throw new PdfEntityNotFoundException('Invoice');
    if (invoice.pdfUrl && !options.force) {
      return { url: invoice.pdfUrl, sizeBytes: 0, generated: false };
    }

    const pdfBuffer = await this.provider.render({
      template: 'invoice',
      data: {
        organizationName: invoice.organization.name,
        organizationAddress: invoice.organization.address,
        customerName: fullName(invoice.customer),
        customerEmail: invoice.customer.email,
        billingAddress: billingAddressLine(invoice.billingAddressSnapshot),
        invoiceNumber: invoice.invoiceNumber,
        paymentReference: invoice.order.payments[0]?.providerPaymentId ?? null,
        itemDescription: describeOrderSnapshot(invoice.order),
        subtotalMinor: invoice.subtotalMinor,
        discountMinor: invoice.discountMinor,
        taxMinor: invoice.taxMinor,
        totalMinor: invoice.totalMinor,
        currency: invoice.currency,
        status: invoice.status,
        issuedAt: invoice.issuedAt ?? invoice.createdAt,
      },
    });
    const pdfAsset = await this.storage.uploadGeneratedAsset({
      organizationId: invoice.organizationId,
      ownerUserId: invoice.customerId,
      entityType: 'INVOICE_PDF',
      entityId: invoice.id,
      filename: `invoice-${invoice.invoiceNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    const claimed = await this.prisma.invoice.updateMany({
      where: { id: invoice.id, ...(options.force ? {} : { pdfUrl: null }) },
      data: { pdfUrl: pdfAsset.url },
    });
    if (claimed.count === 0) {
      return this.concurrentWinnerUrl('Invoice', async () => {
        const row = await this.prisma.invoice.findUnique({
          where: { id: invoice.id },
          select: { pdfUrl: true },
        });
        return row?.pdfUrl ?? null;
      });
    }

    await this.audit(
      options.force ? PDF_AUDIT_ACTIONS.invoiceRegenerated : PDF_AUDIT_ACTIONS.invoiceGenerated,
      'Invoice',
      invoice.id,
      invoice.organizationId,
      pdfAsset.url,
      options,
    );
    return { url: pdfAsset.url, sizeBytes: pdfAsset.sizeBytes, generated: true };
  }

  // ── Payment receipts ─────────────────────────────────────────────────────

  async ensurePaymentReceiptPdf(
    paymentId: string,
    options: EnsurePdfOptions = {},
  ): Promise<GeneratedPdfResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        organizationId: true,
        customerId: true,
        providerPaymentId: true,
        amountMinor: true,
        currency: true,
        status: true,
        receiptPdfUrl: true,
        capturedAt: true,
        createdAt: true,
        organization: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
        order: { select: { receipt: true } },
        paymentMethod: { select: { type: true, displayName: true } },
      },
    });
    if (!payment) throw new PdfEntityNotFoundException('Payment');
    if (payment.receiptPdfUrl && !options.force) {
      return { url: payment.receiptPdfUrl, sizeBytes: 0, generated: false };
    }

    const data: ReceiptTemplateData = {
      kind: 'PAYMENT',
      organizationName: payment.organization.name,
      customerName: fullName(payment.customer),
      customerEmail: payment.customer.email,
      reference: payment.id,
      orderReference: payment.order.receipt,
      transactionReference: payment.providerPaymentId,
      method: payment.paymentMethod?.displayName ?? payment.paymentMethod?.type ?? 'ONLINE',
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      status: payment.status,
      date: payment.capturedAt ?? payment.createdAt,
    };
    const pdfBuffer = await this.provider.render({ template: 'payment_receipt', data });
    const pdfAsset = await this.storage.uploadGeneratedAsset({
      organizationId: payment.organizationId,
      ownerUserId: payment.customerId,
      entityType: 'PAYMENT_RECEIPT_PDF',
      entityId: payment.id,
      filename: `payment-receipt-${payment.id}.pdf`,
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    const claimed = await this.prisma.payment.updateMany({
      where: { id: payment.id, ...(options.force ? {} : { receiptPdfUrl: null }) },
      data: { receiptPdfUrl: pdfAsset.url },
    });
    if (claimed.count === 0) {
      return this.concurrentWinnerUrl('Payment receipt', async () => {
        const row = await this.prisma.payment.findUnique({
          where: { id: payment.id },
          select: { receiptPdfUrl: true },
        });
        return row?.receiptPdfUrl ?? null;
      });
    }

    await this.audit(
      options.force
        ? PDF_AUDIT_ACTIONS.paymentReceiptRegenerated
        : PDF_AUDIT_ACTIONS.paymentReceiptGenerated,
      'Payment',
      payment.id,
      payment.organizationId,
      pdfAsset.url,
      options,
    );
    return { url: pdfAsset.url, sizeBytes: pdfAsset.sizeBytes, generated: true };
  }

  // ── Refund receipts ──────────────────────────────────────────────────────

  async ensureRefundReceiptPdf(
    refundId: string,
    options: EnsurePdfOptions = {},
  ): Promise<GeneratedPdfResult> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      select: {
        id: true,
        organizationId: true,
        providerRefundId: true,
        amountMinor: true,
        currency: true,
        status: true,
        reason: true,
        receiptPdfUrl: true,
        processedAt: true,
        createdAt: true,
        organization: { select: { name: true } },
        order: {
          select: {
            receipt: true,
            customerId: true,
            customer: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        payment: { select: { providerPaymentId: true } },
      },
    });
    if (!refund) throw new PdfEntityNotFoundException('Refund');
    if (refund.receiptPdfUrl && !options.force) {
      return { url: refund.receiptPdfUrl, sizeBytes: 0, generated: false };
    }

    const data: ReceiptTemplateData = {
      kind: 'REFUND',
      organizationName: refund.organization.name,
      customerName: fullName(refund.order.customer),
      customerEmail: refund.order.customer.email,
      reference: refund.providerRefundId ?? refund.id,
      orderReference: refund.order.receipt,
      transactionReference: refund.payment.providerPaymentId,
      method: 'ORIGINAL PAYMENT METHOD',
      amountMinor: refund.amountMinor,
      currency: refund.currency,
      status: refund.status,
      date: refund.processedAt ?? refund.createdAt,
      reason: refund.reason,
    };
    const pdfBuffer = await this.provider.render({ template: 'refund_receipt', data });
    const pdfAsset = await this.storage.uploadGeneratedAsset({
      organizationId: refund.organizationId,
      ownerUserId: refund.order.customerId,
      entityType: 'REFUND_RECEIPT_PDF',
      entityId: refund.id,
      filename: `refund-receipt-${refund.id}.pdf`,
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    const claimed = await this.prisma.refund.updateMany({
      where: { id: refund.id, ...(options.force ? {} : { receiptPdfUrl: null }) },
      data: { receiptPdfUrl: pdfAsset.url },
    });
    if (claimed.count === 0) {
      return this.concurrentWinnerUrl('Refund receipt', async () => {
        const row = await this.prisma.refund.findUnique({
          where: { id: refund.id },
          select: { receiptPdfUrl: true },
        });
        return row?.receiptPdfUrl ?? null;
      });
    }

    await this.audit(
      options.force
        ? PDF_AUDIT_ACTIONS.refundReceiptRegenerated
        : PDF_AUDIT_ACTIONS.refundReceiptGenerated,
      'Refund',
      refund.id,
      refund.organizationId,
      pdfAsset.url,
      options,
    );
    return { url: pdfAsset.url, sizeBytes: pdfAsset.sizeBytes, generated: true };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  /** A concurrent generator committed first; reuse its URL. */
  private async concurrentWinnerUrl(
    entity: string,
    readUrl: () => Promise<string | null>,
  ): Promise<GeneratedPdfResult> {
    const url = await readUrl();
    if (!url) throw new PdfEntityNotFoundException(entity);
    this.logger.log(`${entity} PDF was generated concurrently elsewhere; reusing stored URL.`);
    return { url, sizeBytes: 0, generated: false };
  }

  private async audit(
    action: string,
    entity: string,
    entityId: string,
    organizationId: string,
    pdfUrl: string,
    options: EnsurePdfOptions,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: options.actorUserId ?? null,
        action,
        entity,
        entityId,
        metadata: { organizationId, pdfUrl, force: options.force === true },
      },
    });
  }
}
