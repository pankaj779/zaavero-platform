import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  BatchNotFoundException,
  EnrollmentConflictException,
  EnrollmentForbiddenException,
  EnrollmentNotFoundException,
  InvalidEnrollmentException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherEnrollmentMutationForbiddenException,
} from '../exceptions';
import type {
  EnrollmentRecord,
  EnrollmentRepository,
} from '../interfaces/enrollment-repository.interface';
import { EnrollmentService } from '../services/enrollment.service';

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

function createEnrollment(overrides: Partial<EnrollmentRecord> = {}): EnrollmentRecord {
  return {
    id: 'enrollment-1',
    organizationId: 'org-1',
    courseId: 'course-1',
    batchId: 'batch-1',
    studentId: 'student-1',
    status: 'ACTIVE',
    enrolledAt: new Date('2026-01-01T00:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('EnrollmentService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findByBatchAndStudent = vi.fn();
  const findBatchContext = vi.fn();
  const courseExistsInOrganization = vi.fn();
  const studentProfileExistsInOrganization = vi.fn();
  const findTeacherProfileId = vi.fn();
  const findStudentProfileId = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();

  let service: EnrollmentService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: EnrollmentRepository = {
      marker: 'enrollment-repository',
      findById,
      findMany,
      findByBatchAndStudent,
      findBatchContext,
      courseExistsInOrganization,
      studentProfileExistsInOrganization,
      findTeacherProfileId,
      findStudentProfileId,
      create,
      update,
      softDelete,
    };

    service = new EnrollmentService(repository);
  });

  it('lists enrollments for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createEnrollment()],
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
    expect(result.data.items[0]?.studentId).toBe('student-1');
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

  it('creates an enrollment when course, batch, and student are valid', async () => {
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    courseExistsInOrganization.mockResolvedValue(true);
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByBatchAndStudent.mockResolvedValue(null);
    create.mockResolvedValue(createEnrollment());

    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: 'batch-1',
      studentId: 'student-1',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: 'batch-1',
        studentId: 'student-1',
        courseId: 'course-1',
      }),
    );
    expect(result.data.id).toBe('enrollment-1');
  });

  it('reactivates a dropped enrollment instead of creating a duplicate', async () => {
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    courseExistsInOrganization.mockResolvedValue(true);
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByBatchAndStudent.mockResolvedValue(createEnrollment({ status: 'DROPPED' }));
    update.mockResolvedValue(createEnrollment({ status: 'ACTIVE' }));

    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: 'batch-1',
      studentId: 'student-1',
    });

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      'enrollment-1',
      expect.objectContaining({ status: 'ACTIVE', completedAt: null }),
    );
    expect(result.data.status).toBe('ACTIVE');
  });

  it('rejects create when student is already enrolled', async () => {
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    courseExistsInOrganization.mockResolvedValue(true);
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByBatchAndStudent.mockResolvedValue(createEnrollment({ status: 'ACTIVE' }));

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: 'batch-1',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(EnrollmentConflictException);
  });

  it('rejects create when batch does not belong to course', async () => {
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-other',
      teacherId: 'teacher-1',
    });

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: 'batch-1',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(InvalidEnrollmentException);
  });

  it('rejects create when batch is missing', async () => {
    findBatchContext.mockResolvedValue(null);

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: 'missing',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(BatchNotFoundException);
  });

  it('rejects create when student profile is missing', async () => {
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    courseExistsInOrganization.mockResolvedValue(true);
    studentProfileExistsInOrganization.mockResolvedValue(false);

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: 'batch-1',
        studentId: 'missing-student',
      }),
    ).rejects.toBeInstanceOf(StudentProfileNotFoundException);
  });

  it('forbids teacher mutations on batches they do not teach', async () => {
    findById.mockResolvedValue(createEnrollment());
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-2',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.update(
        createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
        'enrollment-1',
        {
          status: 'COMPLETED',
        },
      ),
    ).rejects.toBeInstanceOf(TeacherEnrollmentMutationForbiddenException);
  });

  it('soft-deletes by marking enrollment as dropped', async () => {
    findById.mockResolvedValue(createEnrollment());
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    softDelete.mockResolvedValue(createEnrollment({ status: 'DROPPED' }));

    const result = await service.softDelete(createUser(), 'enrollment-1');

    expect(softDelete).toHaveBeenCalledWith('enrollment-1');
    expect(result.data.status).toBe('DROPPED');
  });

  it('returns not found for missing enrollments', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      EnrollmentNotFoundException,
    );
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('forces list results to the student own profile and excludes dropped rows', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({ items: [createEnrollment()], total: 1 });

      await service.list(student(), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findStudentProfileId).toHaveBeenCalledWith('org-1', 'user-student');
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 'student-1', excludeDropped: true }),
      );
    });

    it('forbids listing another student enrollments', async () => {
      findStudentProfileId.mockResolvedValue('student-1');

      await expect(
        service.list(student(), {
          studentId: 'student-2',
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ).rejects.toBeInstanceOf(EnrollmentForbiddenException);
    });

    it('rejects list when the student has no profile in the organization', async () => {
      findStudentProfileId.mockResolvedValue(null);

      await expect(
        service.list(student(), {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ).rejects.toBeInstanceOf(StudentProfileNotFoundException);
    });

    it('returns own enrollment by id', async () => {
      findById.mockResolvedValue(createEnrollment());
      findStudentProfileId.mockResolvedValue('student-1');

      const result = await service.getById(student(), 'enrollment-1');
      expect(result.data.studentId).toBe('student-1');
    });

    it('forbids getting another student enrollment by id', async () => {
      findById.mockResolvedValue(createEnrollment({ studentId: 'student-2' }));
      findStudentProfileId.mockResolvedValue('student-1');

      await expect(service.getById(student(), 'enrollment-1')).rejects.toBeInstanceOf(
        EnrollmentForbiddenException,
      );
    });

    it('does not apply student scoping for teachers', async () => {
      findMany.mockResolvedValue({ items: [createEnrollment()], total: 1 });

      await service.list(createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findStudentProfileId).not.toHaveBeenCalled();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: undefined, excludeDropped: false }),
      );
    });
  });
});
