import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AssignmentForbiddenException,
  AssignmentNotFoundException,
  BatchNotFoundException,
  InvalidAssignmentException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherAssignmentMutationForbiddenException,
} from '../exceptions';
import type {
  AssignmentRecord,
  AssignmentRepository,
} from '../interfaces/assignment-repository.interface';
import { AssignmentService } from '../services/assignment.service';

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

function createAssignment(overrides: Partial<AssignmentRecord> = {}): AssignmentRecord {
  return {
    id: 'assignment-1',
    organizationId: 'org-1',
    courseId: 'course-1',
    batchId: null,
    title: 'Essay 1',
    instructions: 'Write an essay.',
    status: 'DRAFT',
    maxScore: 100,
    dueAt: new Date('2026-02-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('AssignmentService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findCourseContext = vi.fn();
  const findBatchContext = vi.fn();
  const findTeacherProfileId = vi.fn();
  const findStudentProfileId = vi.fn();
  const studentHasAccessToAssignment = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();

  let service: AssignmentService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: AssignmentRepository = {
      marker: 'assignment-repository',
      findById,
      findMany,
      findCourseContext,
      findBatchContext,
      findTeacherProfileId,
      findStudentProfileId,
      studentHasAccessToAssignment,
      create,
      update,
      softDelete,
    };

    service = new AssignmentService(repository);
  });

  it('lists assignments for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createAssignment()],
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
    expect(result.data.items[0]?.title).toBe('Essay 1');
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

  it('creates an assignment when course and optional batch are valid', async () => {
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    create.mockResolvedValue(createAssignment({ batchId: 'batch-1' }));

    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: 'batch-1',
      title: 'Essay 1',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'course-1',
        batchId: 'batch-1',
        title: 'Essay 1',
      }),
    );
    expect(result.data.id).toBe('assignment-1');
  });

  it('rejects create when batch does not belong to course', async () => {
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
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
        title: 'Essay 1',
      }),
    ).rejects.toBeInstanceOf(InvalidAssignmentException);
  });

  it('rejects create when maxScore is not positive', async () => {
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        courseId: 'course-1',
        title: 'Essay 1',
        maxScore: 0,
      }),
    ).rejects.toBeInstanceOf(InvalidAssignmentException);
  });

  it('forbids teacher mutations on courses they do not teach', async () => {
    findById.mockResolvedValue(createAssignment());
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-2',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.update(
        createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
        'assignment-1',
        {
          title: 'Updated',
        },
      ),
    ).rejects.toBeInstanceOf(TeacherAssignmentMutationForbiddenException);
  });

  it('allows teacher mutations when they own the batch', async () => {
    findById.mockResolvedValue(createAssignment({ batchId: 'batch-1' }));
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-2',
    });
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');
    update.mockResolvedValue(createAssignment({ title: 'Updated' }));

    const result = await service.update(
      createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
      'assignment-1',
      { title: 'Updated' },
    );

    expect(result.data.title).toBe('Updated');
  });

  it('soft-deletes by setting deletedAt', async () => {
    findById.mockResolvedValue(createAssignment());
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    softDelete.mockResolvedValue(
      createAssignment({ deletedAt: new Date('2026-01-03T00:00:00.000Z') }),
    );

    const result = await service.softDelete(createUser(), 'assignment-1');

    expect(softDelete).toHaveBeenCalledWith('assignment-1');
    expect(result.data.deletedAt).not.toBeNull();
  });

  it('returns not found for missing assignments', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      AssignmentNotFoundException,
    );
  });

  it('rejects create when batch is missing', async () => {
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    findBatchContext.mockResolvedValue(null);

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: 'missing',
        title: 'Essay 1',
      }),
    ).rejects.toBeInstanceOf(BatchNotFoundException);
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('lists only student-visible assignments for enrolled courses and batches', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({
        items: [createAssignment({ status: 'PUBLISHED' })],
        total: 1,
      });

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

    it('returns a student-visible assignment by id', async () => {
      findById.mockResolvedValue(createAssignment({ status: 'PUBLISHED' }));
      findStudentProfileId.mockResolvedValue('student-1');
      studentHasAccessToAssignment.mockResolvedValue(true);

      const result = await service.getById(student(), 'assignment-1');
      expect(studentHasAccessToAssignment).toHaveBeenCalledWith('assignment-1', 'student-1');
      expect(result.data.id).toBe('assignment-1');
    });

    it('forbids getting an assignment outside the student scope', async () => {
      findById.mockResolvedValue(createAssignment({ status: 'DRAFT' }));
      findStudentProfileId.mockResolvedValue('student-1');
      studentHasAccessToAssignment.mockResolvedValue(false);

      await expect(service.getById(student(), 'assignment-1')).rejects.toBeInstanceOf(
        AssignmentForbiddenException,
      );
    });

    it('does not apply student scoping for admins', async () => {
      findMany.mockResolvedValue({ items: [createAssignment()], total: 1 });

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
