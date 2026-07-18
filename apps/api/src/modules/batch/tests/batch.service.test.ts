import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  BatchCourseNotFoundException,
  BatchForbiddenException,
  BatchInvalidCapacityException,
  BatchInvalidScheduleException,
  BatchMutationForbiddenException,
  BatchNameConflictException,
  BatchNotFoundException,
  BatchOrganizationAccessException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type { BatchRecord, BatchRepository } from '../interfaces/batch-repository.interface';
import { BatchService } from '../services/batch.service';

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

function createBatch(overrides: Partial<BatchRecord> = {}): BatchRecord {
  return {
    id: 'batch-1',
    organizationId: 'org-1',
    courseId: 'course-1',
    teacherId: 'teacher-1',
    name: 'Sample Batch',
    status: 'ACTIVE',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T00:00:00.000Z'),
    maxStudents: 50,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('BatchService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findByCourseName = vi.fn();
  const findTeacherProfileId = vi.fn();
  const teacherProfileExistsInOrganization = vi.fn();
  const courseExistsInOrganization = vi.fn();
  const findStudentProfileId = vi.fn();
  const isStudentEnrolledInBatch = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();

  let service: BatchService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: BatchRepository = {
      marker: 'batch-repository',
      findById,
      findMany,
      findByCourseName,
      findTeacherProfileId,
      teacherProfileExistsInOrganization,
      courseExistsInOrganization,
      findStudentProfileId,
      isStudentEnrolledInBatch,
      create,
      update,
      softDelete,
    };

    service = new BatchService(repository);
  });

  it('lists batches for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createBatch()],
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
    expect(result.data.items).toHaveLength(1);
    expect(result.data.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
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
    ).rejects.toBeInstanceOf(BatchOrganizationAccessException);
  });

  it('creates a batch under the caller teacher profile', async () => {
    courseExistsInOrganization.mockResolvedValue(true);
    findTeacherProfileId.mockResolvedValue('teacher-1');
    findByCourseName.mockResolvedValue(null);
    create.mockResolvedValue(createBatch());

    const result = await service.create(
      createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
      {
        organizationId: 'org-1',
        courseId: 'course-1',
        name: 'Sample Batch',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        maxStudents: 50,
      },
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        teacherId: 'teacher-1',
        courseId: 'course-1',
        name: 'Sample Batch',
      }),
    );
    expect(result.data.name).toBe('Sample Batch');
  });

  it('rejects create when course is missing', async () => {
    courseExistsInOrganization.mockResolvedValue(false);

    await expect(
      service.create(createUser({ roles: [AUTH_ROLES.teacher], id: 'user-teacher' }), {
        organizationId: 'org-1',
        courseId: 'missing-course',
        name: 'Sample Batch',
        startDate: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BatchCourseNotFoundException);
  });

  it('rejects create when name already exists for the course', async () => {
    courseExistsInOrganization.mockResolvedValue(true);
    findTeacherProfileId.mockResolvedValue('teacher-1');
    findByCourseName.mockResolvedValue(createBatch());

    await expect(
      service.create(createUser({ roles: [AUTH_ROLES.teacher], id: 'user-teacher' }), {
        organizationId: 'org-1',
        courseId: 'course-1',
        name: 'Sample Batch',
        startDate: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BatchNameConflictException);
  });

  it('rejects create when startDate is not before endDate', async () => {
    await expect(
      service.create(createUser({ roles: [AUTH_ROLES.teacher], id: 'user-teacher' }), {
        organizationId: 'org-1',
        courseId: 'course-1',
        name: 'Sample Batch',
        startDate: '2026-12-31T00:00:00.000Z',
        endDate: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BatchInvalidScheduleException);
  });

  it('rejects create when maxStudents is not greater than zero', async () => {
    await expect(
      service.create(createUser({ roles: [AUTH_ROLES.teacher], id: 'user-teacher' }), {
        organizationId: 'org-1',
        courseId: 'course-1',
        name: 'Sample Batch',
        startDate: '2026-01-01T00:00:00.000Z',
        maxStudents: 0,
      }),
    ).rejects.toBeInstanceOf(BatchInvalidCapacityException);
  });

  it('forbids teacher mutations on another teacher batch', async () => {
    findById.mockResolvedValue(createBatch({ teacherId: 'teacher-2' }));
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.update(createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }), 'batch-1', {
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(BatchMutationForbiddenException);
  });

  it('soft-deletes a batch owned by the teacher', async () => {
    findById.mockResolvedValue(createBatch());
    findTeacherProfileId.mockResolvedValue('teacher-1');
    softDelete.mockResolvedValue(createBatch({ deletedAt: new Date('2026-01-03T00:00:00.000Z') }));

    const result = await service.softDelete(
      createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
      'batch-1',
    );

    expect(softDelete).toHaveBeenCalledWith('batch-1');
    expect(result.message).toBe('Batch deleted successfully.');
  });

  it('returns not found for missing batches', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      BatchNotFoundException,
    );
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('lists only batches the student is enrolled in', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({ items: [createBatch()], total: 1 });

      await service.list(student(), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findStudentProfileId).toHaveBeenCalledWith('org-1', 'user-student');
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledStudentId: 'student-1' }),
      );
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

    it('returns an enrolled batch by id', async () => {
      findById.mockResolvedValue(createBatch());
      findStudentProfileId.mockResolvedValue('student-1');
      isStudentEnrolledInBatch.mockResolvedValue(true);

      const result = await service.getById(student(), 'batch-1');
      expect(isStudentEnrolledInBatch).toHaveBeenCalledWith('batch-1', 'student-1');
      expect(result.data.id).toBe('batch-1');
    });

    it('forbids getting a batch the student is not enrolled in', async () => {
      findById.mockResolvedValue(createBatch());
      findStudentProfileId.mockResolvedValue('student-1');
      isStudentEnrolledInBatch.mockResolvedValue(false);

      await expect(service.getById(student(), 'batch-1')).rejects.toBeInstanceOf(
        BatchForbiddenException,
      );
    });

    it('does not apply student scoping for admins', async () => {
      findMany.mockResolvedValue({ items: [createBatch()], total: 1 });

      await service.list(createUser(), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findStudentProfileId).not.toHaveBeenCalled();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledStudentId: undefined }),
      );
    });
  });
});
