import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  CertificateMutationForbiddenException,
  CertificateNotFoundException,
  InvalidCertificateException,
  OrganizationAccessDeniedException,
} from '../exceptions';
import type {
  CertificateRecord,
  CertificateRepository,
} from '../interfaces/certificate-repository.interface';
import { CertificateService } from '../services/certificate.service';

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-admin',
    email: 'admin@example.com',
    roles: [AUTH_ROLES.admin],
    permissions: [AUTH_PERMISSIONS.courseCreate, AUTH_PERMISSIONS.courseUpdate],
    organizationIds: ['org-1'],
    ...overrides,
  };
}

function createCertificate(overrides: Partial<CertificateRecord> = {}): CertificateRecord {
  return {
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
    issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CertificateService', () => {
  const findById = vi.fn();
  const findByVerificationCode = vi.fn();
  const findMany = vi.fn();
  const findCourseContext = vi.fn();
  const findBatchContext = vi.fn();
  const studentProfileExistsInOrganization = vi.fn();
  const findStudentProfileId = vi.fn();
  const findTeacherProfileId = vi.fn();
  const issue = vi.fn();
  const update = vi.fn();
  const revoke = vi.fn();

  let service: CertificateService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: CertificateRepository = {
      marker: 'certificate-repository',
      findById,
      findByVerificationCode,
      findMany,
      findCourseContext,
      findBatchContext,
      studentProfileExistsInOrganization,
      findStudentProfileId,
      findTeacherProfileId,
      issue,
      update,
      revoke,
    };

    service = new CertificateService(repository);
  });

  it('lists certificates for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createCertificate()],
      total: 1,
    });

    const result = await service.list(createUser(), {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', page: 1, limit: 20 }),
    );
    expect(result.data.meta.totalPages).toBe(1);
  });

  it('restricts students to their own certificates on list', async () => {
    findStudentProfileId.mockResolvedValue('student-1');
    findMany.mockResolvedValue({ items: [], total: 0 });

    await service.list(createUser({ id: 'user-student', roles: [AUTH_ROLES.student] }), {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'student-1' }));
  });

  it('issues a certificate with generated codes', async () => {
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    studentProfileExistsInOrganization.mockResolvedValue(true);
    issue.mockResolvedValue(createCertificate());

    const result = await service.issue(createUser(), {
      organizationId: 'org-1',
      studentId: 'student-1',
      courseId: 'course-1',
    });

    expect(issue).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        studentId: 'student-1',
        courseId: 'course-1',
        certificateNumber: expect.stringMatching(/^CERT-/) as string,
        verificationCode: expect.stringMatching(/^VER-/) as string,
        issuedAt: expect.any(Date) as Date,
      }) as object,
    );
    expect(result.data.status).toBe('ISSUED');
  });

  it('verifies a certificate by verification code', async () => {
    findByVerificationCode.mockResolvedValue(createCertificate());

    const result = await service.verifyByCode(createUser(), 'VER-abc');

    expect(result.data.verificationCode).toBe('VER-abc');
  });

  it('revokes a certificate', async () => {
    findById.mockResolvedValue(createCertificate({ status: 'ISSUED' }));
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    revoke.mockResolvedValue(
      createCertificate({ status: 'REVOKED', revokedAt: new Date('2026-01-03T00:00:00.000Z') }),
    );

    const result = await service.revoke(createUser(), 'cert-1');

    expect(revoke).toHaveBeenCalledWith('cert-1', expect.any(Date) as Date);
    expect(result.data.status).toBe('REVOKED');
  });

  it('rejects revoke when certificate is already revoked', async () => {
    findById.mockResolvedValue(createCertificate({ status: 'REVOKED' }));
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });

    await expect(service.revoke(createUser(), 'cert-1')).rejects.toBeInstanceOf(
      InvalidCertificateException,
    );
  });

  it('forbids teacher mutations on courses they do not teach', async () => {
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-2',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');
    studentProfileExistsInOrganization.mockResolvedValue(true);

    await expect(
      service.issue(createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }), {
        organizationId: 'org-1',
        studentId: 'student-1',
        courseId: 'course-1',
      }),
    ).rejects.toBeInstanceOf(CertificateMutationForbiddenException);
  });

  it('returns not found for missing certificates', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      CertificateNotFoundException,
    );
  });

  it('rejects list access for organizations outside membership', async () => {
    await expect(
      service.list(createUser(), {
        organizationId: 'org-other',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    ).rejects.toBeInstanceOf(OrganizationAccessDeniedException);
  });
});
