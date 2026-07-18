import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  LessonForbiddenException,
  LessonNotFoundException,
  ModuleNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherLessonMutationForbiddenException,
} from '../exceptions';
import type { LessonRecord, LessonRepository } from '../interfaces/lesson-repository.interface';
import { LessonService } from '../services/lesson.service';

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

function createLesson(overrides: Partial<LessonRecord> = {}): LessonRecord {
  return {
    id: 'lesson-1',
    organizationId: 'org-1',
    moduleId: 'module-1',
    title: 'Welcome',
    description: null,
    contentType: 'VIDEO',
    contentUrl: null,
    durationSeconds: 600,
    displayOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('LessonService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findModuleContext = vi.fn();
  const findCourseTeacherId = vi.fn();
  const findTeacherProfileId = vi.fn();
  const findStudentProfileId = vi.fn();
  const studentHasAccessToLesson = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();
  let service: LessonService;

  beforeEach(() => {
    vi.clearAllMocks();
    const repository: LessonRepository = {
      marker: 'lesson-repository',
      findById,
      findMany,
      findModuleContext,
      findCourseTeacherId,
      findTeacherProfileId,
      findStudentProfileId,
      studentHasAccessToLesson,
      create,
      update,
      softDelete,
    };
    service = new LessonService(repository);
  });

  it('lists lessons with pagination meta', async () => {
    findMany.mockResolvedValue({ items: [createLesson()], total: 1 });
    const result = await service.list(createUser(), {
      page: 1,
      limit: 20,
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });
    expect(result.data.meta.totalPages).toBe(1);
    expect(result.data.items[0]?.title).toBe('Welcome');
  });

  it('rejects list for foreign organization', async () => {
    await expect(
      service.list(createUser(), {
        organizationId: 'org-other',
        page: 1,
        limit: 20,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
      }),
    ).rejects.toBeInstanceOf(OrganizationAccessDeniedException);
  });

  it('creates a lesson when module exists', async () => {
    findModuleContext.mockResolvedValue({
      id: 'module-1',
      organizationId: 'org-1',
      courseId: 'course-1',
    });
    create.mockResolvedValue(createLesson());
    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      moduleId: 'module-1',
      title: 'Welcome',
    });
    expect(result.data.id).toBe('lesson-1');
  });

  it('rejects create when module missing', async () => {
    findModuleContext.mockResolvedValue(null);
    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        moduleId: 'missing',
        title: 'Welcome',
      }),
    ).rejects.toBeInstanceOf(ModuleNotFoundException);
  });

  it('blocks teacher mutation for courses they do not own', async () => {
    findModuleContext.mockResolvedValue({
      id: 'module-1',
      organizationId: 'org-1',
      courseId: 'course-1',
    });
    findCourseTeacherId.mockResolvedValue('teacher-other');
    findTeacherProfileId.mockResolvedValue('teacher-1');
    await expect(
      service.create(
        createUser({
          id: 'user-teacher',
          roles: [AUTH_ROLES.teacher],
        }),
        {
          organizationId: 'org-1',
          moduleId: 'module-1',
          title: 'Welcome',
        },
      ),
    ).rejects.toBeInstanceOf(TeacherLessonMutationForbiddenException);
  });

  it('throws when lesson not found', async () => {
    findById.mockResolvedValue(null);
    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      LessonNotFoundException,
    );
  });

  it('soft deletes a lesson', async () => {
    findById.mockResolvedValue(createLesson());
    findModuleContext.mockResolvedValue({
      id: 'module-1',
      organizationId: 'org-1',
      courseId: 'course-1',
    });
    softDelete.mockResolvedValue(createLesson());
    const result = await service.softDelete(createUser(), 'lesson-1');
    expect(softDelete).toHaveBeenCalledWith('lesson-1');
    expect(result.data.id).toBe('lesson-1');
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('lists only lessons for enrolled courses', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({ items: [createLesson()], total: 1 });

      await service.list(student(), {
        page: 1,
        limit: 20,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
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
          sortBy: 'displayOrder',
          sortOrder: 'asc',
        }),
      ).rejects.toBeInstanceOf(StudentProfileNotFoundException);
    });

    it('returns a lesson from an enrolled course by id', async () => {
      findById.mockResolvedValue(createLesson());
      findStudentProfileId.mockResolvedValue('student-1');
      studentHasAccessToLesson.mockResolvedValue(true);

      const result = await service.getById(student(), 'lesson-1');
      expect(studentHasAccessToLesson).toHaveBeenCalledWith('lesson-1', 'student-1');
      expect(result.data.id).toBe('lesson-1');
    });

    it('forbids getting a lesson outside enrolled courses', async () => {
      findById.mockResolvedValue(createLesson());
      findStudentProfileId.mockResolvedValue('student-1');
      studentHasAccessToLesson.mockResolvedValue(false);

      await expect(service.getById(student(), 'lesson-1')).rejects.toBeInstanceOf(
        LessonForbiddenException,
      );
    });

    it('does not apply student scoping for admins', async () => {
      findMany.mockResolvedValue({ items: [createLesson()], total: 1 });

      await service.list(createUser(), {
        page: 1,
        limit: 20,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
      });

      expect(findStudentProfileId).not.toHaveBeenCalled();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledStudentId: undefined }),
      );
    });
  });
});
