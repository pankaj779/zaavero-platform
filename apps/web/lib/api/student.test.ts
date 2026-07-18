import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  apiFetchMock,
  getCoursesMock,
  getBatchesMock,
  getLessonProgressMock,
  markLessonCompleteMock,
  getNotificationsMock,
  getCalendarEventsMock,
  getCertificatesMock,
  createSubmissionMock,
} = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getCoursesMock: vi.fn(),
  getBatchesMock: vi.fn(),
  getLessonProgressMock: vi.fn(),
  markLessonCompleteMock: vi.fn(),
  getNotificationsMock: vi.fn(),
  getCalendarEventsMock: vi.fn(),
  getCertificatesMock: vi.fn(),
  createSubmissionMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./course', () => ({
  CourseApi: { getCourses: getCoursesMock },
}));

vi.mock('./batch', () => ({
  BatchApi: { getBatches: getBatchesMock },
}));

vi.mock('./lesson-progress', () => ({
  LessonProgressApi: {
    getLessonProgress: getLessonProgressMock,
    markLessonComplete: markLessonCompleteMock,
    createLessonProgress: vi.fn(),
    updateLessonProgress: vi.fn(),
  },
}));

vi.mock('./notification', () => ({
  NotificationApi: {
    getNotifications: getNotificationsMock,
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

vi.mock('./calendar', () => ({
  CalendarApi: {
    getCalendarEvents: getCalendarEventsMock,
  },
}));

vi.mock('./certificate', () => ({
  CertificateApi: {
    getCertificates: getCertificatesMock,
    getCertificate: vi.fn(),
    verifyCertificate: vi.fn(),
  },
}));

vi.mock('./submission', () => ({
  SubmissionApi: {
    createSubmission: createSubmissionMock,
    updateSubmission: vi.fn(),
  },
}));

vi.mock('./messaging', () => ({
  MessagingApi: {
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    getMessages: vi.fn(),
    createConversation: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

import { StudentApi } from './student';

const orgId = '22222222-2222-4222-8222-222222222222';
const courseId = '33333333-3333-4333-8333-333333333333';
const batchId = '44444444-4444-4444-8444-444444444444';
const lessonId = '55555555-5555-4555-8555-555555555555';

function mockLookups() {
  getCoursesMock.mockResolvedValue({
    items: [
      {
        id: courseId,
        slug: 'foundations',
        title: 'Foundations',
        description: 'Basics of graphology',
      },
    ],
    meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
  });
  getBatchesMock.mockResolvedValue({
    items: [
      {
        id: batchId,
        name: 'Weekend Cohort',
        course: { id: courseId, slug: 'foundations', title: 'Foundations' },
      },
    ],
    meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
  });
  getLessonProgressMock.mockResolvedValue({
    items: [],
    meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
  });
}

describe('StudentApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getCoursesMock.mockReset();
    getBatchesMock.mockReset();
    getLessonProgressMock.mockReset();
    markLessonCompleteMock.mockReset();
    getNotificationsMock.mockReset();
    getCalendarEventsMock.mockReset();
    getCertificatesMock.mockReset();
    createSubmissionMock.mockReset();
    mockLookups();
  });

  it('getCourses composes enrollment + lessons + progress without fabricating totals', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [
          {
            id: 'enr-1',
            organizationId: orgId,
            courseId,
            batchId,
            studentId: 'stu-1',
            status: 'ACTIVE',
            enrolledAt: '2026-01-01T00:00:00.000Z',
            completedAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: lessonId,
            organizationId: orgId,
            moduleId: 'mod-1',
            title: 'Lesson One',
            description: null,
            contentType: 'VIDEO',
            contentUrl: null,
            durationSeconds: 120,
            displayOrder: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });

    const result = await StudentApi.getCourses({
      organizationId: orgId,
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.course.title).toBe('Foundations');
    expect(result.items[0]?.progress.totalLessons).toBe(1);
    expect(result.items[0]?.progress.completedLessons).toBe(0);
    expect(result.items[0]?.progress.percentage).toBe(0);
    expect(getLessonProgressMock).toHaveBeenCalledTimes(1);
    expect(getCoursesMock).toHaveBeenCalledTimes(1);
    expect(getBatchesMock).toHaveBeenCalledTimes(1);
  });

  it('getLiveClasses preserves meetingUrl from raw live-session records', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [
          {
            id: 'live-1',
            organizationId: orgId,
            batchId,
            title: 'Live Class',
            description: null,
            status: 'SCHEDULED',
            meetingProvider: 'ZOOM',
            meetingUrl: 'https://zoom.example/j/99',
            recordingUrl: null,
            startsAt: '2026-07-20T10:00:00.000Z',
            endsAt: '2026-07-20T11:00:00.000Z',
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      });

    const result = await StudentApi.getLiveClasses({
      organizationId: orgId,
      page: 1,
      limit: 20,
    });

    expect(result.items[0]?.meeting.meetingUrl).toBe('https://zoom.example/j/99');
    expect(result.items[0]?.capabilities.joinMeeting).toBe('available');
  });

  it('getAssignments joins own submissions by assignmentId', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [
          {
            id: 'asg-1',
            organizationId: orgId,
            courseId,
            batchId,
            title: 'Homework',
            instructions: 'Do the work',
            status: 'PUBLISHED',
            maxScore: 10,
            dueAt: '2026-07-25T00:00:00.000Z',
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
            deletedAt: null,
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'sub-1',
            organizationId: orgId,
            assignmentId: 'asg-1',
            studentId: 'stu-1',
            status: 'SUBMITTED',
            content: 'Answer',
            attachments: [],
            score: null,
            feedback: null,
            submittedAt: '2026-07-10T00:00:00.000Z',
            gradedAt: null,
            gradedById: null,
            createdAt: '2026-07-10T00:00:00.000Z',
            updatedAt: '2026-07-10T00:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });

    const result = await StudentApi.getAssignments({
      organizationId: orgId,
      page: 1,
      limit: 20,
    });

    expect(result.items[0]?.instructions).toBe('Do the work');
    expect(result.items[0]?.submission?.status).toBe('submitted');
  });

  it('getAttendance derives percent only from fetched marks', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [
          {
            id: 'att-1',
            organizationId: orgId,
            liveSessionId: 'live-1',
            studentId: 'stu-1',
            status: 'PRESENT',
            markedAt: '2026-07-10T10:00:00.000Z',
            notes: null,
            createdAt: '2026-07-10T10:00:00.000Z',
            updatedAt: '2026-07-10T10:00:00.000Z',
          },
          {
            id: 'att-2',
            organizationId: orgId,
            liveSessionId: 'live-2',
            studentId: 'stu-1',
            status: 'EXCUSED',
            markedAt: '2026-07-11T10:00:00.000Z',
            notes: null,
            createdAt: '2026-07-11T10:00:00.000Z',
            updatedAt: '2026-07-11T10:00:00.000Z',
          },
        ],
        meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'live-1',
            organizationId: orgId,
            batchId,
            title: 'Session 1',
            description: null,
            status: 'COMPLETED',
            meetingProvider: 'NONE',
            meetingUrl: null,
            recordingUrl: null,
            startsAt: '2026-07-10T09:00:00.000Z',
            endsAt: '2026-07-10T10:00:00.000Z',
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-10T10:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });

    const result = await StudentApi.getAttendance({
      organizationId: orgId,
      page: 1,
      limit: 100,
    });

    expect(result.presentCount).toBe(1);
    expect(result.excusedCount).toBe(1);
    // excused excluded from attendance rate denominator
    expect(result.attendancePercent).toBe(100);
  });

  it('markLessonComplete delegates to LessonProgressApi', async () => {
    markLessonCompleteMock.mockResolvedValue({
      id: 'p1',
      organizationId: orgId,
      lessonId,
      studentId: 'stu-1',
      status: 'completed',
      progressPercent: 100,
      lastPositionSeconds: null,
      completedAt: '2026-07-18T00:00:00.000Z',
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
    });

    const result = await StudentApi.markLessonComplete({
      organizationId: orgId,
      lessonId,
    });

    expect(markLessonCompleteMock).toHaveBeenCalledWith({
      organizationId: orgId,
      lessonId,
    });
    expect(result.status).toBe('completed');
  });

  it('getProfile uses AuthSessionUser and optional learning stats', async () => {
    getCertificatesMock.mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      templateIds: new Map(),
    });

    apiFetchMock.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    });

    // getProgress -> getCourses needs enrollments + lessons path; empty enrollments means no lessons fetch
    const profile = await StudentApi.getProfile(
      {
        id: 'user-1',
        email: 'student@example.com',
        firstName: 'Sam',
        lastName: 'Student',
        roles: ['Student'],
        permissions: [],
        organizationIds: [orgId],
      },
      orgId,
    );

    expect(profile.firstName).toBe('Sam');
    expect(profile.email).toBe('student@example.com');
    expect(profile.learning?.percentage).toBeNull();
    expect(profile.avatarUrl).toBeNull();
  });
});
