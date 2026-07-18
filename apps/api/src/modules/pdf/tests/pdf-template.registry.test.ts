import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { PdfTemplateRegistry } from '../templates/pdf-template.registry';

const PDF_MAGIC = '%PDF';

describe('PdfTemplateRegistry', () => {
  const registry = new PdfTemplateRegistry();

  it('renders a real certificate PDF with an embedded QR code', async () => {
    const qrPng = await QRCode.toBuffer('https://app.graphology.test/verify/VER-x', {
      type: 'png',
    });

    const buffer = await registry.render({
      template: 'certificate',
      data: {
        organizationName: 'Graphology Academy',
        studentName: 'Asha Rao',
        courseName: 'Handwriting Analysis',
        teacherName: 'Meera Iyer',
        certificateNumber: 'CERT-1000-AB12CD34',
        verificationCode: 'VER-x',
        verificationUrl: 'https://app.graphology.test/verify/VER-x',
        completedAt: new Date('2026-06-01T00:00:00.000Z'),
        issuedAt: new Date('2026-06-15T00:00:00.000Z'),
        qrPng,
      },
    });

    expect(buffer.subarray(0, 4).toString('ascii')).toBe(PDF_MAGIC);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('renders invoice and receipt PDFs', async () => {
    const invoice = await registry.render({
      template: 'invoice',
      data: {
        organizationName: 'Graphology Academy',
        organizationAddress: null,
        customerName: 'Asha Rao',
        customerEmail: 'asha@example.com',
        billingAddress: 'Bengaluru, KA, IN',
        invoiceNumber: 'INV-202606-ABCDE12345',
        paymentReference: 'pay_rzp1',
        itemDescription: 'Handwriting Analysis — Batch A',
        subtotalMinor: 50_000,
        discountMinor: 0,
        taxMinor: 0,
        totalMinor: 50_000,
        currency: 'INR',
        status: 'PAID',
        issuedAt: new Date('2026-06-15T00:00:00.000Z'),
      },
    });
    const receipt = await registry.render({
      template: 'refund_receipt',
      data: {
        kind: 'REFUND',
        organizationName: 'Graphology Academy',
        customerName: 'Asha Rao',
        customerEmail: 'asha@example.com',
        reference: 'rfnd_rzp1',
        orderReference: 'rcpt_abc',
        transactionReference: 'pay_rzp1',
        method: 'ORIGINAL PAYMENT METHOD',
        amountMinor: 10_000,
        currency: 'INR',
        status: 'PROCESSED',
        date: new Date('2026-06-16T00:00:00.000Z'),
        reason: 'Requested by student',
      },
    });

    expect(invoice.subarray(0, 4).toString('ascii')).toBe(PDF_MAGIC);
    expect(receipt.subarray(0, 4).toString('ascii')).toBe(PDF_MAGIC);
  });
});
