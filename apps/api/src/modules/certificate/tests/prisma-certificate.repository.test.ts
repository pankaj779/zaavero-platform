import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaCertificateRepository } from '../repositories/prisma-certificate.repository';

describe('PrismaCertificateRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const courseFindFirst = vi.fn();
  const batchFindFirst = vi.fn();
  const studentFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaCertificateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaCertificateRepository({
      certificate: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      course: {
        findFirst: courseFindFirst,
      },
      batch: {
        findFirst: batchFindFirst,
      },
      studentProfile: {
        findFirst: studentFindFirst,
      },
      teacherProfile: {
        findFirst: teacherFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists certificates with filters, search, and pagination in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'cert-1',
        organizationId: 'org-1',
        studentId: 'student-1',
        courseId: 'course-1',
        batchId: null,
        templateId: null,
        status: 'ISSUED',
        certificateNumber: 'CERT-123',
        verificationCode: 'VER-abc',
        pdfUrl: null,
        issuedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      studentId: 'student-1',
      search: 'CERT',
      page: 1,
      limit: 10,
      sortBy: 'issuedAt',
      sortOrder: 'desc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        studentId: 'student-1',
        certificateNumber: {
          contains: 'CERT',
          mode: 'insensitive',
        },
      },
      select: expect.any(Object) as object,
      orderBy: { issuedAt: 'desc' },
      skip: 0,
      take: 10,
    });
    expect(result.total).toBe(1);
  });

  it('issues a certificate with ISSUED status', async () => {
    create.mockResolvedValue({
      id: 'cert-1',
      organizationId: 'org-1',
      studentId: 'student-1',
      courseId: 'course-1',
      batchId: null,
      templateId: null,
      status: 'ISSUED',
      certificateNumber: 'CERT-123',
      verificationCode: 'VER-abc',
      pdfUrl: null,
      issuedAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const issuedAt = new Date();
    const result = await repository.issue({
      organizationId: 'org-1',
      studentId: 'student-1',
      courseId: 'course-1',
      certificateNumber: 'CERT-123',
      verificationCode: 'VER-abc',
      issuedAt,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'ISSUED',
        certificateNumber: 'CERT-123',
        verificationCode: 'VER-abc',
        issuedAt,
      }) as object,
      select: expect.any(Object) as object,
    });
    expect(result.status).toBe('ISSUED');
  });
});
