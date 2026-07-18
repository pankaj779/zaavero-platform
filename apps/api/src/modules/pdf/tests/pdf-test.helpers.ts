import { ConfigService } from '@nestjs/config';
import { vi, type Mock } from 'vitest';
import type { PrismaClient } from '@graphology/database';
import type { EnvConfig } from '../../../config/env.schema';
import type { StorageService } from '../../storage/services/storage.service';
import type { PdfProvider } from '../interfaces/pdf.types';

export const ORG_ID = '018f65a0-0000-7000-8000-000000000001';
export const CERT_ID = '018f65a0-0000-7000-8000-0000000000c1';
export const INVOICE_ID = '018f65a0-0000-7000-8000-0000000000d1';
export const PAYMENT_ID = '018f65a0-0000-7000-8000-0000000000e1';
export const REFUND_ID = '018f65a0-0000-7000-8000-0000000000f1';
export const USER_ID = '018f65a0-0000-7000-8000-0000000000aa';

export function createConfig(overrides: Partial<EnvConfig> = {}): ConfigService<EnvConfig, true> {
  return new ConfigService<EnvConfig, true>({
    NODE_ENV: 'test',
    FRONTEND_URL: 'https://app.graphology.test',
    APP_URL: 'https://app.graphology.test',
    ...overrides,
  });
}

export interface PrismaModelMock {
  findUnique: Mock;
  updateMany: Mock;
}

export interface PrismaMock {
  certificate: PrismaModelMock;
  invoice: PrismaModelMock;
  payment: PrismaModelMock;
  refund: PrismaModelMock;
  auditLog: { create: Mock };
}

export function createPrismaMock(): PrismaMock {
  return {
    certificate: { findUnique: vi.fn(), updateMany: vi.fn() },
    invoice: { findUnique: vi.fn(), updateMany: vi.fn() },
    payment: { findUnique: vi.fn(), updateMany: vi.fn() },
    refund: { findUnique: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue(undefined) },
  };
}

export function asPrismaClient(mock: PrismaMock): PrismaClient {
  return mock as unknown as PrismaClient;
}

export interface StorageMock {
  uploadGeneratedAsset: Mock;
}

export function createStorageMock(): StorageMock {
  return {
    uploadGeneratedAsset: vi.fn().mockResolvedValue({
      url: 'https://cdn.storage.test/generated.pdf',
      sizeBytes: 4321,
      id: '018f65a0-0000-7000-8000-0000000000ff',
    }),
  };
}

export function asStorageService(mock: StorageMock): StorageService {
  return mock as unknown as StorageService;
}

export interface ProviderMock extends PdfProvider {
  render: Mock;
}

export function createPdfProviderMock(): ProviderMock {
  return {
    render: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.7 mocked')),
  };
}

const user = { firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com' };

export function certificateRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: CERT_ID,
    organizationId: ORG_ID,
    certificateNumber: 'CERT-1000-AB12CD34',
    verificationCode: 'VER-code123',
    pdfUrl: null,
    completedAt: new Date('2026-06-01T00:00:00.000Z'),
    issuedAt: new Date('2026-06-15T00:00:00.000Z'),
    organization: { name: 'Graphology Academy' },
    student: { userId: USER_ID, user },
    course: { title: 'Handwriting Analysis', teacher: { user } },
    ...overrides,
  };
}

export function invoiceRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: INVOICE_ID,
    organizationId: ORG_ID,
    customerId: USER_ID,
    invoiceNumber: 'INV-202606-ABCDE12345',
    status: 'PAID',
    subtotalMinor: 50_000,
    discountMinor: 0,
    taxMinor: 0,
    totalMinor: 50_000,
    currency: 'INR',
    billingAddressSnapshot: { fullName: 'Asha Rao', email: 'asha@example.com' },
    pdfUrl: null,
    issuedAt: new Date('2026-06-15T00:00:00.000Z'),
    createdAt: new Date('2026-06-15T00:00:00.000Z'),
    organization: { name: 'Graphology Academy', address: null },
    customer: user,
    order: {
      id: 'order-1',
      purpose: 'COURSE_PURCHASE',
      courseTitleSnapshot: 'Handwriting Analysis',
      batchNameSnapshot: 'Batch A',
      planNameSnapshot: null,
      payments: [{ providerPaymentId: 'pay_rzp1' }],
    },
    ...overrides,
  };
}

export function paymentRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: PAYMENT_ID,
    organizationId: ORG_ID,
    customerId: USER_ID,
    providerPaymentId: 'pay_rzp1',
    amountMinor: 50_000,
    currency: 'INR',
    status: 'CAPTURED',
    receiptPdfUrl: null,
    capturedAt: new Date('2026-06-15T00:05:00.000Z'),
    createdAt: new Date('2026-06-15T00:05:00.000Z'),
    organization: { name: 'Graphology Academy' },
    customer: user,
    order: { receipt: 'rcpt_abc' },
    paymentMethod: { type: 'UPI', displayName: 'UPI ****abc' },
    ...overrides,
  };
}

export function refundRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: REFUND_ID,
    organizationId: ORG_ID,
    providerRefundId: 'rfnd_rzp1',
    amountMinor: 10_000,
    currency: 'INR',
    status: 'PROCESSED',
    reason: 'Requested by student',
    receiptPdfUrl: null,
    processedAt: new Date('2026-06-16T00:00:00.000Z'),
    createdAt: new Date('2026-06-16T00:00:00.000Z'),
    organization: { name: 'Graphology Academy' },
    order: { receipt: 'rcpt_abc', customerId: USER_ID, customer: user },
    payment: { providerPaymentId: 'pay_rzp1' },
    ...overrides,
  };
}
