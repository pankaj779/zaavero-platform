import { Injectable } from '@nestjs/common';
import { PDFDocument, type PDFPage, type PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type {
  CertificateTemplateData,
  InvoiceTemplateData,
  PdfRenderRequest,
  PdfTemplateName,
  ReceiptTemplateData,
} from '../interfaces/pdf.types';

const NAVY = rgb(0.08, 0.15, 0.28);
const BLUE = rgb(0.12, 0.42, 0.72);
const GOLD = rgb(0.82, 0.62, 0.2);
const MUTED = rgb(0.38, 0.43, 0.5);
const LIGHT = rgb(0.94, 0.96, 0.98);

function date(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

/**
 * WinAnsi-safe money formatting: standard PDF fonts cannot encode symbols
 * like ₹, so the ISO currency code is used instead.
 */
function money(valueMinor: number, currency: string): string {
  const amount = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueMinor / 100);
  return `${currency} ${amount}`;
}

function truncate(value: string, max = 72): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function center(page: PDFPage, font: PDFFont, text: string, size: number, y: number): void {
  page.drawText(text, {
    x: (page.getWidth() - font.widthOfTextAtSize(text, size)) / 2,
    y,
    size,
    font,
    color: NAVY,
  });
}

function labelValue(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  label: string,
  value: string,
  y: number,
): void {
  page.drawText(label.toUpperCase(), { x: 54, y, size: 8, font: bold, color: MUTED });
  page.drawText(truncate(value), { x: 190, y: y - 1, size: 10, font: regular, color: NAVY });
}

function documentHeader(
  page: PDFPage,
  bold: PDFFont,
  organizationName: string,
  title: string,
): void {
  page.drawRectangle({
    x: 0,
    y: page.getHeight() - 112,
    width: page.getWidth(),
    height: 112,
    color: NAVY,
  });
  page.drawText(truncate(organizationName, 48), {
    x: 48,
    y: page.getHeight() - 48,
    size: 17,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(title, {
    x: 48,
    y: page.getHeight() - 82,
    size: 26,
    font: bold,
    color: rgb(1, 1, 1),
  });
}

@Injectable()
export class PdfTemplateRegistry {
  readonly names = [
    'certificate',
    'invoice',
    'payment_receipt',
    'refund_receipt',
  ] as const satisfies readonly PdfTemplateName[];

  async render(request: PdfRenderRequest): Promise<Buffer> {
    switch (request.template) {
      case 'certificate':
        return this.certificate(request.data as CertificateTemplateData);
      case 'invoice':
        return this.invoice(request.data as InvoiceTemplateData);
      case 'payment_receipt':
      case 'refund_receipt':
        return this.receipt(request.data as ReceiptTemplateData);
    }
  }

  private async certificate(data: CertificateTemplateData): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const qr = await pdf.embedPng(data.qrPng);

    page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: LIGHT });
    page.drawRectangle({
      x: 18,
      y: 18,
      width: 806,
      height: 559,
      borderColor: NAVY,
      borderWidth: 3,
    });
    page.drawRectangle({
      x: 28,
      y: 28,
      width: 786,
      height: 539,
      borderColor: GOLD,
      borderWidth: 1,
    });
    center(page, bold, data.organizationName.toUpperCase(), 16, 520);
    center(page, bold, 'CERTIFICATE OF COMPLETION', 31, 448);
    center(page, italic, 'This certificate is proudly presented to', 15, 398);
    center(page, bold, truncate(data.studentName, 44), 29, 347);
    page.drawLine({
      start: { x: 215, y: 334 },
      end: { x: 627, y: 334 },
      thickness: 1,
      color: GOLD,
    });
    center(page, regular, 'for successfully completing', 13, 304);
    center(page, bold, truncate(data.courseName, 54), 22, 269);
    center(
      page,
      regular,
      `Completed ${date(data.completedAt ?? data.issuedAt)}  •  Issued ${date(data.issuedAt)}`,
      10,
      230,
    );

    page.drawText(`Instructor: ${truncate(data.teacherName, 34)}`, {
      x: 75,
      y: 116,
      size: 11,
      font: bold,
      color: NAVY,
    });
    page.drawText(`Certificate: ${data.certificateNumber}`, {
      x: 75,
      y: 92,
      size: 9,
      font: regular,
      color: MUTED,
    });
    page.drawText(`Verification: ${data.verificationCode}`, {
      x: 75,
      y: 74,
      size: 8,
      font: regular,
      color: MUTED,
    });
    page.drawImage(qr, { x: 680, y: 62, width: 92, height: 92 });
    page.drawText('Scan to verify', { x: 691, y: 48, size: 8, font: regular, color: MUTED });

    return Buffer.from(await pdf.save());
  }

  private async invoice(data: InvoiceTemplateData): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    documentHeader(page, bold, data.organizationName, 'INVOICE');

    page.drawText(`Invoice ${data.invoiceNumber}`, {
      x: 48,
      y: 690,
      size: 17,
      font: bold,
      color: NAVY,
    });
    page.drawText(`Issued ${date(data.issuedAt)}  •  ${data.status}`, {
      x: 48,
      y: 668,
      size: 10,
      font: regular,
      color: MUTED,
    });
    page.drawText('BILLED TO', { x: 48, y: 620, size: 9, font: bold, color: BLUE });
    page.drawText(truncate(data.customerName), {
      x: 48,
      y: 600,
      size: 12,
      font: bold,
      color: NAVY,
    });
    page.drawText(truncate(data.customerEmail), {
      x: 48,
      y: 583,
      size: 10,
      font: regular,
      color: MUTED,
    });
    page.drawText(truncate(data.billingAddress, 76), {
      x: 48,
      y: 566,
      size: 9,
      font: regular,
      color: MUTED,
    });

    page.drawRectangle({ x: 48, y: 480, width: 499, height: 42, color: LIGHT });
    page.drawText('DESCRIPTION', { x: 60, y: 496, size: 9, font: bold, color: NAVY });
    page.drawText('AMOUNT', { x: 462, y: 496, size: 9, font: bold, color: NAVY });
    page.drawText(truncate(data.itemDescription, 58), {
      x: 60,
      y: 451,
      size: 11,
      font: regular,
      color: NAVY,
    });
    page.drawText(money(data.subtotalMinor, data.currency), {
      x: 450,
      y: 451,
      size: 10,
      font: regular,
      color: NAVY,
    });
    labelValue(page, regular, bold, 'Subtotal', money(data.subtotalMinor, data.currency), 380);
    labelValue(page, regular, bold, 'Discount', money(data.discountMinor, data.currency), 354);
    labelValue(page, regular, bold, 'Tax', money(data.taxMinor, data.currency), 328);
    page.drawLine({ start: { x: 48, y: 303 }, end: { x: 547, y: 303 }, color: BLUE });
    labelValue(page, bold, bold, 'Total', money(data.totalMinor, data.currency), 276);
    labelValue(page, regular, bold, 'Payment ref.', data.paymentReference ?? '—', 224);
    labelValue(page, regular, bold, 'From', data.organizationAddress ?? data.organizationName, 198);

    return Buffer.from(await pdf.save());
  }

  private async receipt(data: ReceiptTemplateData): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const title = data.kind === 'PAYMENT' ? 'PAYMENT RECEIPT' : 'REFUND RECEIPT';
    documentHeader(page, bold, data.organizationName, title);

    page.drawRectangle({ x: 48, y: 638, width: 499, height: 76, color: LIGHT });
    page.drawText(money(data.amountMinor, data.currency), {
      x: 68,
      y: 670,
      size: 27,
      font: bold,
      color: BLUE,
    });
    page.drawText(data.status, { x: 430, y: 672, size: 11, font: bold, color: NAVY });

    labelValue(page, regular, bold, 'Customer', data.customerName, 586);
    labelValue(page, regular, bold, 'Email', data.customerEmail, 554);
    labelValue(page, regular, bold, 'Receipt ref.', data.reference, 506);
    labelValue(page, regular, bold, 'Order ref.', data.orderReference, 474);
    labelValue(page, regular, bold, 'Transaction', data.transactionReference ?? '—', 442);
    labelValue(page, regular, bold, 'Method', data.method, 410);
    labelValue(page, regular, bold, 'Date', date(data.date), 378);
    if (data.reason) labelValue(page, regular, bold, 'Reason', data.reason, 346);
    page.drawText('This document was generated electronically and requires no signature.', {
      x: 48,
      y: 90,
      size: 9,
      font: regular,
      color: MUTED,
    });

    return Buffer.from(await pdf.save());
  }
}
