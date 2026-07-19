import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  InvalidLiveSessionException,
  LiveSessionForbiddenException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type {
  LiveSessionRecord,
  LiveSessionRepository,
} from '../interfaces/live-session-repository.interface';
import { LiveSessionService } from '../services/live-session.service';

function user(o: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'u1',
    email: 'a@x.com',
    roles: [AUTH_ROLES.admin],
    permissions: [],
    organizationIds: ['org-1'],
    ...o,
  };
}
function row(o: Partial<LiveSessionRecord> = {}): LiveSessionRecord {
  return {
    id: 'ls-1',
    organizationId: 'org-1',
    batchId: 'batch-1',
    meetingIntegrationId: null,
    title: 'Class',
    description: null,
    status: 'SCHEDULED',
    meetingProvider: 'ZOOM',
    providerMeetingId: null,
    meetingUrl: null,
    hostUrlEncrypted: null,
    recordingUrl: null,
    timezone: 'Asia/Kolkata',
    recurrenceRule: null,
    syncStatus: 'IDLE',
    syncError: null,
    startsAt: new Date('2026-02-01T10:00:00.000Z'),
    endsAt: new Date('2026-02-01T11:00:00.000Z'),
    startedAt: null,
    endedAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...o,
  };
}

describe('LiveSessionService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findBatchContext = vi.fn();
  const findTeacherProfileId = vi.fn();
  const findStudentProfileId = vi.fn();
  const isStudentEnrolledInBatch = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();
  let service: LiveSessionService;
  beforeEach(() => {
    vi.clearAllMocks();
    const repo: LiveSessionRepository = {
      marker: 'live-session-repository',
      findById,
      findMany,
      findBatchContext,
      findTeacherProfileId,
      findStudentProfileId,
      isStudentEnrolledInBatch,
      create,
      update,
      softDelete,
    };
    service = new LiveSessionService(repo);
  });

  it('lists sessions', async () => {
    findMany.mockResolvedValue({ items: [row()], total: 1 });
    const result = await service.list(user(), {
      page: 1,
      limit: 20,
      sortBy: 'startsAt',
      sortOrder: 'asc',
    });
    expect(result.data.items[0]?.title).toBe('Class');
  });

  it('rejects bad schedule', async () => {
    findBatchContext.mockResolvedValue({ id: 'batch-1', organizationId: 'org-1', teacherId: 't1' });
    await expect(
      service.create(user(), {
        organizationId: 'org-1',
        batchId: 'batch-1',
        title: 'Class',
        startsAt: '2026-02-01T12:00:00.000Z',
        endsAt: '2026-02-01T11:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InvalidLiveSessionException);
  });

  it('creates session', async () => {
    findBatchContext.mockResolvedValue({ id: 'batch-1', organizationId: 'org-1', teacherId: 't1' });
    create.mockResolvedValue(row());
    const result = await service.create(user(), {
      organizationId: 'org-1',
      batchId: 'batch-1',
      title: 'Class',
      startsAt: '2026-02-01T10:00:00.000Z',
    });
    expect(result.data.id).toBe('ls-1');
  });

  it('rejects foreign org', async () => {
    await expect(
      service.list(user(), {
        organizationId: 'x',
        page: 1,
        limit: 20,
        sortBy: 'startsAt',
        sortOrder: 'asc',
      }),
    ).rejects.toBeInstanceOf(OrganizationAccessDeniedException);
  });

  describe('student scoping', () => {
    const student = () => user({ id: 'user-student', roles: [AUTH_ROLES.student] });

    it('lists only sessions for enrolled batches', async () => {
      findStudentProfileId.mockResolvedValue('student-1');
      findMany.mockResolvedValue({ items: [row()], total: 1 });

      await service.list(student(), { page: 1, limit: 20, sortBy: 'startsAt', sortOrder: 'asc' });

      expect(findStudentProfileId).toHaveBeenCalledWith('org-1', 'user-student');
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledStudentId: 'student-1' }),
      );
    });

    it('rejects list when the student has no profile in the organization', async () => {
      findStudentProfileId.mockResolvedValue(null);

      await expect(
        service.list(student(), { page: 1, limit: 20, sortBy: 'startsAt', sortOrder: 'asc' }),
      ).rejects.toBeInstanceOf(StudentProfileNotFoundException);
    });

    it('returns a session for an enrolled batch by id', async () => {
      findById.mockResolvedValue(row());
      findStudentProfileId.mockResolvedValue('student-1');
      isStudentEnrolledInBatch.mockResolvedValue(true);

      const result = await service.getById(student(), 'ls-1');
      expect(isStudentEnrolledInBatch).toHaveBeenCalledWith('batch-1', 'student-1');
      expect(result.data.id).toBe('ls-1');
    });

    it('forbids getting a session for a batch the student is not enrolled in', async () => {
      findById.mockResolvedValue(row());
      findStudentProfileId.mockResolvedValue('student-1');
      isStudentEnrolledInBatch.mockResolvedValue(false);

      await expect(service.getById(student(), 'ls-1')).rejects.toBeInstanceOf(
        LiveSessionForbiddenException,
      );
    });

    it('does not apply student scoping for admins', async () => {
      findMany.mockResolvedValue({ items: [row()], total: 1 });

      await service.list(user(), { page: 1, limit: 20, sortBy: 'startsAt', sortOrder: 'asc' });

      expect(findStudentProfileId).not.toHaveBeenCalled();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledStudentId: undefined }),
      );
    });
  });
});
