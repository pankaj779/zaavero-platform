import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { LessonProgressConflictException, OrganizationAccessDeniedException } from '../exceptions';
import type {
  LessonProgressRecord,
  LessonProgressRepository,
} from '../interfaces/lesson-progress-repository.interface';
import { LessonProgressService } from '../services/lesson-progress.service';

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'u1',
    email: 'a@x.com',
    roles: [AUTH_ROLES.admin],
    permissions: [],
    organizationIds: ['org-1'],
    ...overrides,
  };
}
function row(overrides: Partial<LessonProgressRecord> = {}): LessonProgressRecord {
  return {
    id: 'lp-1',
    organizationId: 'org-1',
    lessonId: 'lesson-1',
    studentId: 'student-1',
    status: 'IN_PROGRESS',
    progressPercent: 40,
    lastPositionSeconds: 10,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('LessonProgressService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const findByLessonAndStudent = vi.fn();
  const lessonExistsInOrganization = vi.fn();
  const studentProfileExistsInOrganization = vi.fn();
  const findStudentProfileId = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  let service: LessonProgressService;

  beforeEach(() => {
    vi.clearAllMocks();
    const repo: LessonProgressRepository = {
      marker: 'lesson-progress-repository',
      findById,
      findMany,
      findByLessonAndStudent,
      lessonExistsInOrganization,
      studentProfileExistsInOrganization,
      findStudentProfileId,
      create,
      update,
    };
    service = new LessonProgressService(repo);
  });

  it('lists with pagination', async () => {
    findMany.mockResolvedValue({ items: [row()], total: 1 });
    const result = await service.list(user(), {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.data.meta.total).toBe(1);
  });

  it('rejects foreign org', async () => {
    await expect(
      service.list(user(), {
        organizationId: 'other',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    ).rejects.toBeInstanceOf(OrganizationAccessDeniedException);
  });

  it('creates progress', async () => {
    lessonExistsInOrganization.mockResolvedValue(true);
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByLessonAndStudent.mockResolvedValue(null);
    create.mockResolvedValue(row());
    const result = await service.create(user(), {
      organizationId: 'org-1',
      lessonId: 'lesson-1',
      studentId: 'student-1',
      progressPercent: 40,
    });
    expect(result.data.id).toBe('lp-1');
  });

  it('rejects duplicate progress', async () => {
    lessonExistsInOrganization.mockResolvedValue(true);
    studentProfileExistsInOrganization.mockResolvedValue(true);
    findByLessonAndStudent.mockResolvedValue(row());
    await expect(
      service.create(user(), {
        organizationId: 'org-1',
        lessonId: 'lesson-1',
        studentId: 'student-1',
      }),
    ).rejects.toBeInstanceOf(LessonProgressConflictException);
  });

  it('marks complete at 100%', async () => {
    findById.mockResolvedValue(row());
    update.mockImplementation(
      (_id: string, data: { status?: LessonProgressRecord['status']; completedAt?: Date | null }) =>
        Promise.resolve(
          row({
            status: data.status ?? 'COMPLETED',
            progressPercent: 100,
            completedAt: data.completedAt ?? new Date(),
          }),
        ),
    );
    const result = await service.update(user(), 'lp-1', { progressPercent: 100 });
    expect(result.data.status).toBe('COMPLETED');
    expect(result.data.completedAt).toBeTruthy();
  });
});
