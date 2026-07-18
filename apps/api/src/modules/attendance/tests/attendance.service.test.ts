import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AttendanceConflictException,
  AttendanceForbiddenException,
  AttendanceNotFoundException,
  LiveSessionNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherAttendanceMutationForbiddenException,
} from '../exceptions';
import type {
  AttendanceRecord,
  AttendanceRepository,
} from '../interfaces/attendance-repository.interface';
import { AttendanceService } from '../services/attendance.service';

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

function createAttendance(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: 'attendance-1',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    studentId: 'student-1',
    status: 'PRESENT',
    markedAt: new Date('2026-02-01T10:05:00.000Z'),
    notes: null,
    createdAt: new Date('2026-02-01T10:05:00.000Z'),
    updatedAt: new Date('2026-02-01T10:05:00.000Z'),
    ...overrides,
  };
}

describe('AttendanceService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findByLiveSessionAndStudent = vi.fn();
  const findLiveSessionContext = vi.fn();
  const studentProfileExistsInOrganization = vi.fn();
  const findTeacherProfileId = vi.fn();
  const findStudentProfileId = vi.fn();
  const create = vi.fn();
  const update = vi.fn();

  let service: AttendanceService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: AttendanceRepository = {
      marker: 'attendance-repository',
      findById,
      findMany,
      findByLiveSessionAndStudent,
      findLiveSessionContext,
      studentProfileExistsInOrganization,
      findTeacherProfileId,
      findStudentProfileId,
      create,
      update,
    };

    service = new AttendanceService(repository);
  });

  it('lists attendances for a resolved organization with pagination meta', async () => {
    findMany.mockResolvedValue({
      items: [createAttendance()],
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
    expect(result.data.items[0]?.status).toBe('PRESENT');
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

  it('marks attendance when live session and student are valid', async () => {
    findLiveSessionContext.mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batchTeacherId: 'teacher-1',
    });
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByLiveSessionAndStudent.mockResolvedValue(null);
    create.mockResolvedValue(createAttendance());

    const result = await service.mark(createUser(), {
      organizationId: 'org-1',
      liveSessionId: 'session-1',
      studentId: 'student-1',
      status: 'PRESENT',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        liveSessionId: 'session-1',
        studentId: 'student-1',
        markedAt: expect.any(Date) as Date,
      }),
    );
    expect(result.data.id).toBe('attendance-1');
  });

  it('rejects mark when attendance already exists', async () => {
    findLiveSessionContext.mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batchTeacherId: 'teacher-1',
    });
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByLiveSessionAndStudent.mockResolvedValue(createAttendance());

    await expect(
      service.mark(createUser(), {
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(AttendanceConflictException);
  });

  it('rejects mark when live session is missing', async () => {
    findLiveSessionContext.mockResolvedValue(null);

    await expect(
      service.mark(createUser(), {
        organizationId: 'org-1',
        liveSessionId: 'missing',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(LiveSessionNotFoundException);
  });

  it('rejects mark when student profile is missing', async () => {
    findLiveSessionContext.mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batchTeacherId: 'teacher-1',
    });
    studentProfileExistsInOrganization.mockResolvedValue(false);

    await expect(
      service.mark(createUser(), {
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        studentId: 'missing-student',
      }),
    ).rejects.toBeInstanceOf(StudentProfileNotFoundException);
  });

  it('forbids teacher mutations on live sessions they do not teach', async () => {
    findById.mockResolvedValue(createAttendance());
    findLiveSessionContext.mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batchTeacherId: 'teacher-2',
    });
    findTeacherProfileId.mockResolvedValue('teacher-1');

    await expect(
      service.update(
        createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }),
        'attendance-1',
        { status: 'LATE' },
      ),
    ).rejects.toBeInstanceOf(TeacherAttendanceMutationForbiddenException);
  });

  it('updates an existing attendance record', async () => {
    findById.mockResolvedValue(createAttendance());
    findLiveSessionContext.mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batchTeacherId: 'teacher-1',
    });
    update.mockResolvedValue(createAttendance({ status: 'LATE' }));

    const result = await service.update(createUser(), 'attendance-1', {
      status: 'LATE',
    });

    expect(update).toHaveBeenCalledWith(
      'attendance-1',
      expect.objectContaining({ status: 'LATE' }),
    );
    expect(result.data.status).toBe('LATE');
  });

  it('returns not found for missing attendance records', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      AttendanceNotFoundException,
    );
  });

  describe('student scoping', () => {
    const student = () =>
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] });

    it('forces list results to the student own attendance rows', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({ items: [createAttendance()], total: 1 });

      await service.list(student(), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findStudentProfileId).toHaveBeenCalledWith('org-1', 'user-student');
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'student-1' }));
    });

    it('forbids listing another student attendance', async () => {
      findStudentProfileId.mockResolvedValue('student-1');

      await expect(
        service.list(student(), {
          studentId: 'student-2',
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ).rejects.toBeInstanceOf(AttendanceForbiddenException);
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

    it('returns own attendance by id', async () => {
      findById.mockResolvedValue(createAttendance());
      findStudentProfileId.mockResolvedValue('student-1');

      const result = await service.getById(student(), 'attendance-1');
      expect(result.data.studentId).toBe('student-1');
    });

    it('forbids getting another student attendance by id', async () => {
      findById.mockResolvedValue(createAttendance({ studentId: 'student-2' }));
      findStudentProfileId.mockResolvedValue('student-1');

      await expect(service.getById(student(), 'attendance-1')).rejects.toBeInstanceOf(
        AttendanceForbiddenException,
      );
    });

    it('does not apply student scoping for teachers', async () => {
      findMany.mockResolvedValue({ items: [createAttendance()], total: 1 });

      await service.list(createUser({ id: 'user-teacher', roles: [AUTH_ROLES.teacher] }), {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findStudentProfileId).not.toHaveBeenCalled();
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ studentId: undefined }));
    });
  });
});
