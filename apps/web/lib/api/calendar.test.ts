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

import { CalendarApi } from './calendar';

describe('CalendarApi', () => {
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
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getCalendarEvents maps payload and enriches course/batch', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          courseId: '33333333-3333-4333-8333-333333333333',
          batchId: '44444444-4444-4444-8444-444444444444',
          liveSessionId: '55555555-5555-4555-8555-555555555555',
          assignmentId: null,
          title: 'Foundations Live Session',
          description: 'Weekly live class',
          startsAt: '2026-07-18T11:00:00.000Z',
          endsAt: '2026-07-18T12:00:00.000Z',
          allDay: false,
          externalProvider: 'NONE',
          externalEventId: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-02T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await CalendarApi.getCalendarEvents({
      organizationId: '22222222-2222-4222-8222-222222222222',
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-31T23:59:59.999Z',
      search: 'Foundations',
      sortBy: 'startsAt',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/calendar-events?organizationId=22222222-2222-4222-8222-222222222222&from=2026-07-01T00%3A00%3A00.000Z&to=2026-07-31T23%3A59%3A59.999Z&search=Foundations&page=1&limit=20&sortBy=startsAt&sortOrder=asc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe('live_class');
    expect(result.items[0]?.course?.title).toBe('Foundations');
    expect(result.items[0]?.batch?.name).toBe('Weekend Cohort');
    expect(result.items[0]?.meetingUrl).toBeNull();
    expect(result.items[0]?.location).toBeNull();
    expect(result.meta.total).toBe(1);
  });

  it('get / create / update / delete calendar events', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      courseId: null,
      batchId: null,
      liveSessionId: null,
      assignmentId: '66666666-6666-4666-8666-666666666666',
      title: 'Essay due',
      description: null,
      startsAt: '2026-07-20T18:30:00.000Z',
      endsAt: null,
      allDay: false,
      externalProvider: 'GOOGLE',
      externalEventId: 'ext-1',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
      deletedAt: null,
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(CalendarApi.getCalendarEvent(record.id)).resolves.toMatchObject({
      id: record.id,
      type: 'assignment_due',
      meetingProvider: 'Google',
      mentor: { name: 'Teacher' },
    });

    await CalendarApi.createCalendarEvent({
      organizationId: record.organizationId,
      title: 'Essay due',
      startsAt: record.startsAt,
      assignmentId: record.assignmentId,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/calendar-events', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        title: 'Essay due',
        startsAt: record.startsAt,
        assignmentId: record.assignmentId,
      }),
    });

    await CalendarApi.updateCalendarEvent(record.id, { title: 'Updated due' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/calendar-events/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated due' }),
    });

    apiFetchMock.mockResolvedValueOnce(null);
    await CalendarApi.deleteCalendarEvent(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/calendar-events/${record.id}`, {
      method: 'DELETE',
    });
  });
});
