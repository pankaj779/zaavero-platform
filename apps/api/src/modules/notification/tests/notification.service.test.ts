import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  InvalidNotificationException,
  NotificationForbiddenException,
  NotificationNotFoundException,
  OrganizationAccessDeniedException,
} from '../exceptions';
import type {
  NotificationRecord,
  NotificationRepository,
} from '../interfaces/notification-repository.interface';
import { NotificationService } from '../services/notification.service';

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

function createNotification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 'notification-1',
    organizationId: 'org-1',
    userId: 'user-student',
    channel: 'IN_APP',
    type: 'assignment.due',
    title: 'Assignment due',
    body: 'Submit by tomorrow',
    data: null,
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('NotificationService', () => {
  const findById = vi.fn();
  const findMany = vi.fn();
  const userExistsInOrganization = vi.fn();
  const create = vi.fn();
  const updateReadState = vi.fn();
  const markAllRead = vi.fn();

  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: NotificationRepository = {
      marker: 'notification-repository',
      findById,
      findMany,
      userExistsInOrganization,
      create,
      updateReadState,
      markAllRead,
    };

    service = new NotificationService(repository);
  });

  it('lists notifications for students scoped to their own user id', async () => {
    findMany.mockResolvedValue({ items: [createNotification()], total: 1 });

    await service.list(
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
      {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', userId: 'user-student' }),
    );
  });

  it('allows admins to filter notifications by userId', async () => {
    findMany.mockResolvedValue({ items: [], total: 0 });

    await service.list(createUser(), {
      userId: 'user-student',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-student' }));
  });

  it('creates a notification for a valid organization member', async () => {
    userExistsInOrganization.mockResolvedValue(true);
    create.mockResolvedValue(createNotification());

    const result = await service.create(createUser(), {
      organizationId: 'org-1',
      userId: 'user-student',
      type: 'assignment.due',
      title: 'Assignment due',
    });

    expect(create).toHaveBeenCalled();
    expect(result.data.title).toBe('Assignment due');
  });

  it('rejects notification creation for users outside the organization', async () => {
    userExistsInOrganization.mockResolvedValue(false);

    await expect(
      service.create(createUser(), {
        organizationId: 'org-1',
        userId: 'user-other',
        type: 'assignment.due',
        title: 'Assignment due',
      }),
    ).rejects.toBeInstanceOf(InvalidNotificationException);
  });

  it('marks a notification as read for the owner', async () => {
    findById.mockResolvedValue(createNotification({ userId: 'user-student', readAt: null }));
    updateReadState.mockResolvedValue(
      createNotification({ userId: 'user-student', readAt: new Date() }),
    );

    const result = await service.markRead(
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
      'notification-1',
    );

    expect(updateReadState).toHaveBeenCalledWith('notification-1', true);
    expect(result.data.readAt).not.toBeNull();
  });

  it('marks all unread notifications as read for the current user', async () => {
    markAllRead.mockResolvedValue(3);

    const result = await service.markAllRead(
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
    );

    expect(markAllRead).toHaveBeenCalledWith('org-1', 'user-student');
    expect(result.data.updatedCount).toBe(3);
  });

  it('rejects student access to another user notification', async () => {
    findById.mockResolvedValue(createNotification({ userId: 'user-other' }));

    await expect(
      service.getById(
        createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
        'notification-1',
      ),
    ).rejects.toBeInstanceOf(NotificationForbiddenException);
  });

  it('rejects organization access outside membership', async () => {
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

  it('throws when a notification is missing', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById(createUser(), 'missing')).rejects.toBeInstanceOf(
      NotificationNotFoundException,
    );
  });
});
