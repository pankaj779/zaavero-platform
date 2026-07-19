import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock, getCoursesMock, getBatchesMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getCoursesMock: vi.fn(),
  getBatchesMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./course', () => ({
  CourseApi: {
    getCourses: getCoursesMock,
  },
}));

vi.mock('./batch', () => ({
  BatchApi: {
    getBatches: getBatchesMock,
  },
}));

import { LiveSessionApi } from './live-session';

describe('LiveSessionApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getCoursesMock.mockReset();
    getBatchesMock.mockReset();
    getCoursesMock.mockResolvedValue({
      items: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          slug: 'foundations',
          title: 'Foundations',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    getBatchesMock.mockResolvedValue({
      items: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Weekend Cohort',
          course: {
            id: '33333333-3333-4333-8333-333333333333',
            slug: 'foundations',
            title: 'Foundations',
          },
          studentsEnrolled: 18,
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getLiveSessions maps payload and enriches course/batch', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          batchId: '44444444-4444-4444-8444-444444444444',
          title: 'Live Session 1',
          description: null,
          status: 'SCHEDULED',
          meetingProvider: 'ZOOM',
          meetingUrl: 'https://zoom.example/j/1',
          recordingUrl: null,
          startsAt: '2026-08-01T10:00:00.000Z',
          endsAt: '2026-08-01T11:00:00.000Z',
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-02T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await LiveSessionApi.getLiveSessions({
      search: 'live',
      status: 'SCHEDULED',
      meetingProvider: 'ZOOM',
      sortBy: 'startsAt',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/live-sessions?status=SCHEDULED&meetingProvider=ZOOM&search=live&page=1&limit=20&sortBy=startsAt&sortOrder=asc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('scheduled');
    expect(result.items[0]?.meeting.provider).toBe('Zoom');
    expect(result.items[0]?.meeting.meetingUrl).toBeNull();
    expect(result.items[0]?.course.title).toBe('Foundations');
    expect(result.items[0]?.batch.name).toBe('Weekend Cohort');
    expect(result.items[0]?.durationMinutes).toBe(60);
    expect(result.meta.total).toBe(1);
  });

  it('getLiveSession / create / update / delete return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      batchId: '44444444-4444-4444-8444-444444444444',
      title: 'Live Session 2',
      description: 'Desc',
      status: 'LIVE',
      meetingProvider: 'GOOGLE_MEET',
      meetingUrl: null, hostUrl: null,
      recordingUrl: null,
      startsAt: '2026-08-01T10:00:00.000Z',
      endsAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(LiveSessionApi.getLiveSession(record.id)).resolves.toMatchObject({
      id: record.id,
      status: 'live',
      meeting: { provider: 'Google Meet', status: 'in_progress' },
    });

    await LiveSessionApi.createLiveSession({
      organizationId: record.organizationId,
      batchId: record.batchId,
      title: record.title,
      startsAt: record.startsAt,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/live-sessions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        batchId: record.batchId,
        title: record.title,
        startsAt: record.startsAt,
      }),
    });

    await LiveSessionApi.updateLiveSession(record.id, { title: 'Updated' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/live-sessions/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    await LiveSessionApi.deleteLiveSession(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/live-sessions/${record.id}`, {
      method: 'DELETE',
    });
  });
});
