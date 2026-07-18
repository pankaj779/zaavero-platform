import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificateVerificationService } from '../services/certificate-verification.service';
import { asPrismaClient, createPrismaMock, type PrismaMock } from './pdf-test.helpers';

function verificationRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: 'ISSUED',
    certificateNumber: 'CERT-1000-AB12CD34',
    verificationCode: 'VER-code123',
    completedAt: new Date('2026-06-01T00:00:00.000Z'),
    issuedAt: new Date('2026-06-15T00:00:00.000Z'),
    revokedAt: null,
    organization: { name: 'Graphology Academy', logo: null },
    student: { user: { firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com' } },
    course: { title: 'Handwriting Analysis' },
    ...overrides,
  };
}

describe('CertificateVerificationService', () => {
  let prisma: PrismaMock;
  let service: CertificateVerificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    service = new CertificateVerificationService(asPrismaClient(prisma));
  });

  it('returns VALID with display-only fields for an issued certificate', async () => {
    prisma.certificate.findUnique.mockResolvedValue(verificationRow());

    const result = await service.verify('VER-code123');

    expect(result.status).toBe('VALID');
    expect(result.studentName).toBe('Asha Rao');
    expect(result.courseName).toBe('Handwriting Analysis');
    expect(result.organizationName).toBe('Graphology Academy');
    expect(result.issuedAt).toBe('2026-06-15T00:00:00.000Z');
    // The public payload must never leak internal identifiers.
    expect(JSON.stringify(result)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}/);
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('organizationId');
    expect(result).not.toHaveProperty('studentId');
  });

  it('returns REVOKED for revoked certificates', async () => {
    prisma.certificate.findUnique.mockResolvedValue(
      verificationRow({ status: 'REVOKED', revokedAt: new Date('2026-07-01T00:00:00.000Z') }),
    );

    const result = await service.verify('VER-code123');

    expect(result.status).toBe('REVOKED');
    expect(result.revokedAt).toBe('2026-07-01T00:00:00.000Z');
  });

  it('returns NOT_FOUND for unknown codes', async () => {
    prisma.certificate.findUnique.mockResolvedValue(null);

    const result = await service.verify('VER-unknown');

    expect(result.status).toBe('NOT_FOUND');
    expect(result.certificateNumber).toBeNull();
    expect(result.studentName).toBeNull();
  });

  it('hides non-issued certificates as NOT_FOUND', async () => {
    prisma.certificate.findUnique.mockResolvedValue(verificationRow({ status: 'PENDING' }));

    const result = await service.verify('VER-code123');

    expect(result.status).toBe('NOT_FOUND');
  });
});
