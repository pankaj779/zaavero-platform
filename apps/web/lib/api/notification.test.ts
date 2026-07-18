import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

import { NotificationApi } from './notification';

const record = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  channel: 'IN_APP',
  type: 'ANNOUNCEMENT',
  title: 'Course update',
  body: 'A course announcement was posted.',
  data: null,
  readAt: null,
  createdAt: '2026-07-18T08:00:00.000Z',
  updatedAt: '2026-07-18T08:00:00.000Z',
};

describe('NotificationApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('lists notifications with supported backend filters and pagination metadata', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [record],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });

    const result = await NotificationApi.getNotifications({
      organizationId: record.organizationId,
      channel: 'IN_APP',
      type: 'announcement',
      unreadOnly: true,
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/notifications?organizationId=${record.organizationId}&channel=IN_APP&type=announcement&unreadOnly=true&page=1&limit=100&sortBy=createdAt&sortOrder=desc`,
    );
    expect(result.items[0]).toMatchObject({
      id: record.id,
      type: 'announcement',
      readAt: null,
    });
    expect(result.meta.total).toBe(1);
  });

  it('supports get, update read state, mark-read, and read-all', async () => {
    apiFetchMock.mockResolvedValue(record);

    await expect(NotificationApi.getNotification(record.id)).resolves.toMatchObject({
      id: record.id,
    });
    expect(apiFetchMock).toHaveBeenCalledWith(`/notifications/${record.id}`);

    await NotificationApi.updateNotification(record.id, { read: false });
    expect(apiFetchMock).toHaveBeenCalledWith(`/notifications/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: false }),
    });

    await NotificationApi.markNotificationRead(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/notifications/${record.id}/read`, {
      method: 'PATCH',
    });

    apiFetchMock.mockResolvedValueOnce({ updatedCount: 2 });
    await expect(NotificationApi.markAllNotificationsRead(record.organizationId)).resolves.toEqual({
      updatedCount: 2,
    });
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/notifications/read-all?organizationId=${record.organizationId}`,
      { method: 'POST' },
    );
  });
});
