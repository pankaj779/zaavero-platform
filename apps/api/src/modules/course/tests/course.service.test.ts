import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  CourseForbiddenException,
  CourseMutationForbiddenException,
  CourseNotFoundException,
  CourseOrganizationAccessException,
  CourseSlugConflictException,
  CourseTeacherProfileRequiredException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type { CourseRecord, CourseRepository } from '../interfaces/course-repository.interface';
import { CourseService } from '../services/course.service';

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

function createCourse(overrides: Partial<CourseRecord> = {}): CourseRecord {
  return {
    id: 'course-1',
    organizationId: 'org-1',
    teacherId: 'teacher-1',
    title: 'Sample Course',
    slug: 'sample-course',
    description: 'Desc',
    difficulty: 'BEGINNER',
    status: 'DRAFT',
    language: 'en',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('CourseService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findByOrganizationSlug = vi.fn();
  const findTeacherProfileId = vi.fn();
  const teacherProfileExistsInOrganization = vi.fn();
  const findStudentProfileId = vi.fn();
  const isStudentEnrolledInCourse = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();

  let service: CourseService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: CourseRepository = {
      marker: 'course-repository',
      findById,
      findMany,
      findByOrganizationSlug,
      findTeacherProfileId,
      teacherProfileExistsInOrganization,
      findStudentProfileId,
      isStudentEnrolledInCourse,
      create,
      update,
      softDelete,
    };

    service = new CourseService(repository);
  });

  it('lists courses for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createCourse()],
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
    expect(result.data.items[0]?.createdAt).toBe('2026-01-01T00:00:00.000Z');
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
    ).rejects.toBeInstanceOf(CourseOrganizationAccessException);
  });

  it('creates a course using the caller teacher profile when teacherId omitted', async () => {
    findTeacherProfileId.mockResolvedValue('teacher-1');
    findByOrganizationSlug.mockResolvedValue(null);
    create.mockResolvedValue(createCourse());

    const teacher = createUser({
      id: 'user-teacher',
      roles: [AUTH_ROLES.teacher],
      email: 'teacher@example.com',
    });

    const result = await service.create(teacher, {
      organizationId: 'org-1',
      title: 'Sample Course',
      slug: 'sample-course',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: 'teacher-1', slug: 'sample-course' }),
    );
    expect(result.data.slug).toBe('sample-course');
  });

  it('rejects create when slug already exists', async () => {
    findTeacherProfileId.mockResolvedValue('teacher-1');
    findByOrganizationSlug.mockResolvedValue(createCourse());

    await expect(
      service.create(createUser({ roles: [AUTH_ROLES.teacher], id: 'user-teacher' }), {
        organizationId: 'org-1',
        title: 'Sample Course',
        slug: 'sample-course',
      }),
    ).rejects.toBeInstanceOf(CourseSlugConflictException);
  });

  it('rejects create when teacher profile is missing', async () => {
    findTeacherProfileId.mockResolvedValue(null);

    await expect(
      service.create(createUser({ roles: [AUTH_ROLES.teacher], id: 'user-teacher' }), {
        organizationId: 'org-1',
        title: 'Sample Course',
        slug: 'sample-course',
      }),
    ).rejects.toBeInstanceOf(CourseTeacherProfileRequiredException);
  });

  it('soft-deletes a course owned by the teacher', async () => {
    findById.mockResolvedValue(createCourse());
    findTeacherProfileId.mockResolvedValue('teacher-1');
    softDelete.mockResolvedValue(createCourse({ deletedAt: new Date('2026-01-03T00:00:00.000Z') }));

    const result = await service.softDelete(
      createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
      'course-1',
    );

    expect(softDelete).toHaveBeenCalledWith('course-1');
    expect(result.message).toBe('Course deleted successfully.');
  });

  it('forbids teacher mutations on another teacher course', async () => {
    findById.mockResolvedValue(createCourse({ teacherId: 'teacher-2' }));
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.update(createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }), 'course-1', {
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(CourseMutationForbiddenException);
  });

  it('returns not found for missing courses', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      CourseNotFoundException,
    );
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('lists only courses the student is enrolled in', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({ items: [createCourse()], total: 1 });

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

    it('returns an enrolled course by id', async () => {
      findById.mockResolvedValue(createCourse());
      findStudentProfileId.mockResolvedValue('student-1');
      isStudentEnrolledInCourse.mockResolvedValue(true);

      const result = await service.getById(student(), 'course-1');
      expect(isStudentEnrolledInCourse).toHaveBeenCalledWith('course-1', 'student-1');
      expect(result.data.id).toBe('course-1');
    });

    it('forbids getting a course the student is not enrolled in', async () => {
      findById.mockResolvedValue(createCourse());
      findStudentProfileId.mockResolvedValue('student-1');
      isStudentEnrolledInCourse.mockResolvedValue(false);

      await expect(service.getById(student(), 'course-1')).rejects.toBeInstanceOf(
        CourseForbiddenException,
      );
    });

    it('does not apply student scoping for admins', async () => {
      findMany.mockResolvedValue({ items: [createCourse()], total: 1 });

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
