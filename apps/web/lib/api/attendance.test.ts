import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock, getLiveSessionsMock, getLiveSessionMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getLiveSessionsMock: vi.fn(),
  getLiveSessionMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./live-session', () => ({
  LiveSessionApi: {
    getLiveSessions: getLiveSessionsMock,
    getLiveSession: getLiveSessionMock,
  },
}));

import { AttendanceApi } from './attendance';

describe('AttendanceApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getLiveSessionsMock.mockReset();
    getLiveSessionMock.mockReset();
    getLiveSessionsMock.mockResolvedValue({
      items: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          title: 'Foundations Live 1',
          course: {
            id: '33333333-3333-4333-8333-333333333333',
            slug: 'foundations',
            title: 'Foundations',
          },
          batch: {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Weekend Cohort',
            studentsEnrolled: 12,
          },
          mentor: { id: '', name: 'Teacher' },
          startsAt: '2026-07-01T10:00:00.000Z',
          endsAt: '2026-07-01T11:00:00.000Z',
          durationMinutes: 60,
          status: 'completed',
          meeting: { provider: 'Zoom', status: 'ended', meetingUrl: null, hostUrl: null },
          attendance: {
            totalStudents: 12,
            present: 0,
            absent: 0,
            attendancePercent: null,
          },
          integrations: {
            calendar: 'coming_soon',
            notifications: 'coming_soon',
            meetingProvisioning: 'coming_soon',
            recording: 'coming_soon',
          },
          updatedAt: '2026-07-01T12:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getAttendances maps payload, groups by session, and enriches lookups', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          liveSessionId: '55555555-5555-4555-8555-555555555555',
          studentId: '66666666-6666-4666-8666-666666666666',
          status: 'PRESENT',
          markedAt: '2026-07-01T10:05:00.000Z',
          notes: null,
          createdAt: '2026-07-01T10:05:00.000Z',
          updatedAt: '2026-07-01T10:05:00.000Z',
        },
        {
          id: '77777777-7777-4777-8777-777777777777',
          organizationId: '22222222-2222-4222-8222-222222222222',
          liveSessionId: '55555555-5555-4555-8555-555555555555',
          studentId: '88888888-8888-4888-8888-888888888888',
          status: 'ABSENT',
          markedAt: '2026-07-01T10:06:00.000Z',
          notes: null,
          createdAt: '2026-07-01T10:06:00.000Z',
          updatedAt: '2026-07-01T10:06:00.000Z',
        },
      ],
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await AttendanceApi.getAttendances({
      organizationId: '22222222-2222-4222-8222-222222222222',
      page: 1,
      limit: 20,
      sortBy: 'markedAt',
      sortOrder: 'desc',
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/attendances?organizationId=22222222-2222-4222-8222-222222222222&page=1&limit=20&sortBy=markedAt&sortOrder=desc',
    );
    expect(getLiveSessionsMock).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Foundations Live 1');
    expect(result.items[0]?.course.title).toBe('Foundations');
    expect(result.items[0]?.batch.name).toBe('Weekend Cohort');
    expect(result.items[0]?.status).toBe('completed');
    expect(result.items[0]?.counts.present).toBe(1);
    expect(result.items[0]?.counts.absent).toBe(1);
    expect(result.items[0]?.counts.attendancePercent).toBe(50);
    expect(result.items[0]?.records).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('getAttendance / create / update return mapped session DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      liveSessionId: '55555555-5555-4555-8555-555555555555',
      studentId: '66666666-6666-4666-8666-666666666666',
      status: 'LATE',
      markedAt: '2026-07-01T10:05:00.000Z',
      notes: null,
      createdAt: '2026-07-01T10:05:00.000Z',
      updatedAt: '2026-07-01T10:05:00.000Z',
    };

    getLiveSessionMock.mockResolvedValue({
      id: record.liveSessionId,
      title: 'Foundations Live 1',
      course: {
        id: '33333333-3333-4333-8333-333333333333',
        slug: 'foundations',
        title: 'Foundations',
      },
      batch: {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Weekend Cohort',
        studentsEnrolled: 12,
      },
      mentor: { id: '', name: 'Teacher' },
      startsAt: '2026-07-01T10:00:00.000Z',
      endsAt: '2026-07-01T11:00:00.000Z',
      durationMinutes: 60,
      status: 'completed',
      meeting: { provider: 'Zoom', status: 'ended', meetingUrl: null, hostUrl: null },
      attendance: {
        totalStudents: 12,
        present: 0,
        absent: 0,
        attendancePercent: null,
      },
      integrations: {
        calendar: 'coming_soon',
        notifications: 'coming_soon',
        meetingProvisioning: 'coming_soon',
        recording: 'coming_soon',
      },
      updatedAt: '2026-07-01T12:00:00.000Z',
    });

    apiFetchMock.mockResolvedValue(record);

    await expect(AttendanceApi.getAttendance(record.id)).resolves.toMatchObject({
      id: record.liveSessionId,
      status: 'completed',
      records: [{ status: 'present', studentName: 'Student' }],
    });

    await AttendanceApi.createAttendance({
      organizationId: record.organizationId,
      liveSessionId: record.liveSessionId,
      studentId: record.studentId,
      status: 'PRESENT',
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/attendances', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        liveSessionId: record.liveSessionId,
        studentId: record.studentId,
        status: 'PRESENT',
      }),
    });

    await AttendanceApi.updateAttendance(record.id, { status: 'ABSENT' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/attendances/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ABSENT' }),
    });
  });
});
