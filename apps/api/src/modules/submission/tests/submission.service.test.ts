import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  InvalidSubmissionException,
  OrganizationAccessDeniedException,
  SubmissionConflictException,
  SubmissionForbiddenException,
  SubmissionNotFoundException,
} from '../exceptions';
import type {
  SubmissionRecord,
  SubmissionRepository,
} from '../interfaces/submission-repository.interface';
import { SubmissionService } from '../services/submission.service';

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-admin',
    email: 'admin@example.com',
    roles: [AUTH_ROLES.admin],
    permissions: [],
    organizationIds: ['org-1'],
    ...overrides,
  };
}

function createSubmission(overrides: Partial<SubmissionRecord> = {}): SubmissionRecord {
  return {
    id: 'submission-1',
    organizationId: 'org-1',
    assignmentId: 'assignment-1',
    studentId: 'student-1',
    status: 'PENDING',
    content: null,
    attachments: [],
    score: null,
    feedback: null,
    submittedAt: null,
    gradedAt: null,
    gradedById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('SubmissionService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findByAssignmentAndStudent = vi.fn();
  const findAssignmentContext = vi.fn();
  const findCourseContext = vi.fn();
  const studentProfileExistsInOrganization = vi.fn();
  const findStudentProfileId = vi.fn();
  const findTeacherProfileId = vi.fn();
  const create = vi.fn();
  const update = vi.fn();

  let service: SubmissionService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: SubmissionRepository = {
      marker: 'submission-repository',
      findById,
      findMany,
      findByAssignmentAndStudent,
      findAssignmentContext,
      findCourseContext,
      studentProfileExistsInOrganization,
      findStudentProfileId,
      findTeacherProfileId,
      create,
      update,
    };

    service = new SubmissionService(repository);
  });

  it('lists submissions for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createSubmission()],
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

  it('restricts students to their own submissions on list', async () => {
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

  it('creates a submission when assignment and student are valid', async () => {
    findAssignmentContext.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      maxScore: 100,
      dueAt: new Date('2026-12-01T00:00:00.000Z'),
      deletedAt: null,
    });
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByAssignmentAndStudent.mockResolvedValue(null);
    create.mockResolvedValue(createSubmission({ status: 'SUBMITTED' }));

    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      status: 'SUBMITTED',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        status: 'SUBMITTED',
      }),
    );
    expect(result.data.id).toBe('submission-1');
  });

  it('marks submission as LATE when past due date on submit', async () => {
    findAssignmentContext.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      maxScore: 100,
      dueAt: new Date('2020-01-01T00:00:00.000Z'),
      deletedAt: null,
    });
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByAssignmentAndStudent.mockResolvedValue(null);
    create.mockResolvedValue(createSubmission({ status: 'LATE' }));

    await service.create(createUser(), {
      organizationId: 'org-1',
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      status: 'SUBMITTED',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'LATE', submittedAt: expect.any(Date) as Date }),
    );
  });

  it('rejects duplicate submissions', async () => {
    findAssignmentContext.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      maxScore: 100,
      dueAt: null,
      deletedAt: null,
    });
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByAssignmentAndStudent.mockResolvedValue(createSubmission());

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        assignmentId: 'assignment-1',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(SubmissionConflictException);
  });

  it('rejects invalid status transitions for students', async () => {
    findById.mockResolvedValue(createSubmission({ status: 'PENDING' }));
    findAssignmentContext.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      maxScore: 100,
      dueAt: null,
      deletedAt: null,
    });
    findStudentProfileId.mockResolvedValue('student-1');

    await expect(
      service.update(
        createUser({ id: 'user-student', roles: [AUTH_ROLES.student] }),
        'submission-1',
        {
          status: 'GRADED',
        },
      ),
    ).rejects.toBeInstanceOf(SubmissionForbiddenException);
  });

  it('grades a submission as teacher with score validation', async () => {
    findById.mockResolvedValue(createSubmission({ status: 'SUBMITTED' }));
    findAssignmentContext.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      maxScore: 100,
      dueAt: null,
      deletedAt: null,
    });
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');
    update.mockResolvedValue(createSubmission({ status: 'GRADED', score: 85 }));

    const result = await service.update(
      createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
      'submission-1',
      { score: 85, status: 'GRADED' },
    );

    expect(update).toHaveBeenCalledWith(
      'submission-1',
      expect.objectContaining({
        score: 85,
        status: 'GRADED',
        gradedById: 'teacher-1',
        gradedAt: expect.any(Date) as Date,
      }),
    );
    expect(result.data.status).toBe('GRADED');
  });

  it('rejects scores above maxScore', async () => {
    findById.mockResolvedValue(createSubmission({ status: 'SUBMITTED' }));
    findAssignmentContext.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      maxScore: 50,
      dueAt: null,
      deletedAt: null,
    });
    findCourseContext.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.update(createUser({ roles: [AUTH_ROLES.teacher] }), 'submission-1', {
        score: 60,
        status: 'GRADED',
      }),
    ).rejects.toBeInstanceOf(InvalidSubmissionException);
  });

  it('returns not found for missing submissions', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      SubmissionNotFoundException,
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
