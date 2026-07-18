import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  BatchNotFoundException,
  CalendarEventForbiddenException,
  CalendarEventNotFoundException,
  InvalidCalendarEventException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherCalendarMutationForbiddenException,
} from '../exceptions';
import type {
  CalendarEventRecord,
  CalendarRepository,
} from '../interfaces/calendar-repository.interface';
import { CalendarService } from '../services/calendar.service';

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

function createEvent(overrides: Partial<CalendarEventRecord> = {}): CalendarEventRecord {
  return {
    id: 'event-1',
    organizationId: 'org-1',
    courseId: null,
    batchId: null,
    liveSessionId: null,
    assignmentId: null,
    title: 'Office hours',
    description: null,
    startsAt: new Date('2026-02-01T10:00:00.000Z'),
    endsAt: new Date('2026-02-01T11:00:00.000Z'),
    allDay: false,
    externalProvider: 'NONE',
    externalEventId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('CalendarService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findCourseContext = vi.fn();
  const findBatchContext = vi.fn();
  const findLiveSessionContext = vi.fn();
  const findAssignmentContext = vi.fn();
  const findTeacherProfileId = vi.fn();
  const teacherExistsInOrganization = vi.fn();
  const findStudentProfileId = vi.fn();
  const studentHasAccessToEvent = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();

  let service: CalendarService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: CalendarRepository = {
      marker: 'calendar-repository',
      findById,
      findMany,
      findCourseContext,
      findBatchContext,
      findLiveSessionContext,
      findAssignmentContext,
      findTeacherProfileId,
      teacherExistsInOrganization,
      findStudentProfileId,
      studentHasAccessToEvent,
      create,
      update,
      softDelete,
    };

    service = new CalendarService(repository);
  });

  it('lists calendar events for a resolved organization', async () => {
    findMany.mockResolvedValue({ items: [createEvent()], total: 1 });

    const result = await service.list(createUser(), {
      page: 1,
      limit: 20,
      sortBy: 'startsAt',
      sortOrder: 'asc',
    });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-1' }));
    expect(result.data.meta.totalPages).toBe(1);
  });

  it('creates a standalone calendar event as admin', async () => {
    create.mockResolvedValue(createEvent());

    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      title: 'Office hours',
      startsAt: '2026-02-01T10:00:00.000Z',
      endsAt: '2026-02-01T11:00:00.000Z',
    });

    expect(create).toHaveBeenCalled();
    expect(result.data.title).toBe('Office hours');
  });

  it('rejects invalid schedules where endsAt is before startsAt', async () => {
    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        title: 'Invalid',
        startsAt: '2026-02-01T11:00:00.000Z',
        endsAt: '2026-02-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InvalidCalendarEventException);
  });

  it('validates batch belongs to course when both are provided', async () => {
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
        title: 'Class',
        startsAt: '2026-02-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InvalidCalendarEventException);
  });

  it('rejects teacher mutation when batch is owned by another teacher', async () => {
    findBatchContext.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-other',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.create(
        createUser({
          id: 'user-teacher',
          roles: [AUTH_ROLES.teacher],
          permissions: [AUTH_PERMISSIONS.courseCreate],
        }),
        {
          organizationId: 'org-1',
          batchId: 'batch-1',
          title: 'Class',
          startsAt: '2026-02-01T10:00:00.000Z',
        },
      ),
    ).rejects.toBeInstanceOf(TeacherCalendarMutationForbiddenException);
  });

  it('soft-deletes an existing calendar event', async () => {
    findById.mockResolvedValue(createEvent());
    softDelete.mockResolvedValue(createEvent({ deletedAt: new Date() }));

    const result = await service.softDelete(createUser(), 'event-1');

    expect(softDelete).toHaveBeenCalledWith('event-1');
    expect(result.data.deletedAt).not.toBeNull();
  });

  it('rejects organization access outside membership', async () => {
    await expect(
      service.list(createUser(), {
        organizationId: 'org-other',
        page: 1,
        limit: 20,
        sortBy: 'startsAt',
        sortOrder: 'asc',
      }),
    ).rejects.toBeInstanceOf(OrganizationAccessDeniedException);
  });

  it('throws when a batch is missing from the organization', async () => {
    findBatchContext.mockResolvedValue(null);

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        batchId: 'batch-missing',
        title: 'Class',
        startsAt: '2026-02-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BatchNotFoundException);
  });

  it('throws when a calendar event is missing', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      CalendarEventNotFoundException,
    );
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('lists only events tied to the student enrollments', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({
        items: [createEvent({ batchId: 'batch-1' })],
        total: 1,
      });

      await service.list(student(), {
        page: 1,
        limit: 20,
        sortBy: 'startsAt',
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
          sortBy: 'startsAt',
          sortOrder: 'asc',
        }),
      ).rejects.toBeInstanceOf(StudentProfileNotFoundException);
    });

    it('returns an event within the student scope by id', async () => {
      findById.mockResolvedValue(createEvent({ batchId: 'batch-1' }));
      findStudentProfileId.mockResolvedValue('student-1');
      studentHasAccessToEvent.mockResolvedValue(true);

      const result = await service.getById(student(), 'event-1');
      expect(studentHasAccessToEvent).toHaveBeenCalledWith('event-1', 'student-1');
      expect(result.data.id).toBe('event-1');
    });

    it('forbids getting an event outside the student scope', async () => {
      findById.mockResolvedValue(createEvent());
      findStudentProfileId.mockResolvedValue('student-1');
      studentHasAccessToEvent.mockResolvedValue(false);

      await expect(service.getById(student(), 'event-1')).rejects.toBeInstanceOf(
        CalendarEventForbiddenException,
      );
    });

    it('does not apply student scoping for admins', async () => {
      findMany.mockResolvedValue({ items: [createEvent()], total: 1 });

      await service.list(createUser(), {
        page: 1,
        limit: 20,
        sortBy: 'startsAt',
        sortOrder: 'asc',
      });

      expect(findStudentProfileId).not.toHaveBeenCalled();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledStudentId: undefined }),
      );
    });
  });
});
