import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

import { LessonProgressApi } from './lesson-progress';

const record = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  lessonId: '33333333-3333-4333-8333-333333333333',
  studentId: '66666666-6666-4666-8666-666666666666',
  status: 'IN_PROGRESS',
  progressPercent: 40,
  lastPositionSeconds: 10,
  completedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-10T09:00:00.000Z',
};

describe('LessonProgressApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('lists lesson progress with query params', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [record],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await LessonProgressApi.getLessonProgress({
      organizationId: record.organizationId,
      lessonId: record.lessonId,
      status: 'IN_PROGRESS',
      page: 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/lesson-progress?organizationId=${record.organizationId}&lessonId=${record.lessonId}&status=IN_PROGRESS&page=1&limit=20&sortBy=updatedAt&sortOrder=desc`,
    );
    expect(result.items[0]?.status).toBe('in_progress');
    expect(result.meta.total).toBe(1);
  });

  it('creates progress without studentId', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ...record,
      status: 'COMPLETED',
      progressPercent: 100,
      completedAt: '2026-07-11T00:00:00.000Z',
    });

    const result = await LessonProgressApi.createLessonProgress({
      organizationId: record.organizationId,
      lessonId: record.lessonId,
      status: 'COMPLETED',
      progressPercent: 100,
    });

    expect(apiFetchMock).toHaveBeenCalledWith('/lesson-progress', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        lessonId: record.lessonId,
        status: 'COMPLETED',
        progressPercent: 100,
      }),
    });
    expect(result.status).toBe('completed');
  });

  it('markLessonComplete updates when a row exists', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [record],
        meta: { total: 1, page: 1, limit: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        ...record,
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: '2026-07-11T00:00:00.000Z',
      });

    const result = await LessonProgressApi.markLessonComplete({
      organizationId: record.organizationId,
      lessonId: record.lessonId,
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(2, `/lesson-progress/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED', progressPercent: 100 }),
    });
    expect(result.status).toBe('completed');
  });

  it('markLessonComplete creates when no row exists', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [],
        meta: { total: 0, page: 1, limit: 1, totalPages: 0 },
      })
      .mockResolvedValueOnce({
        ...record,
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: '2026-07-11T00:00:00.000Z',
      });

    const result = await LessonProgressApi.markLessonComplete({
      organizationId: record.organizationId,
      lessonId: record.lessonId,
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/lesson-progress', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        lessonId: record.lessonId,
        status: 'COMPLETED',
        progressPercent: 100,
      }),
    });
    expect(result.progressPercent).toBe(100);
  });
});
