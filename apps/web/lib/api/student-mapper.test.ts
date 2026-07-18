import { describe, expect, it } from 'vitest';
import type { AuthSessionUser } from '../auth/auth-types';
import type { AssignmentApiRecord } from './assignment-mapper';
import type { AttendanceApiRecord } from './attendance-mapper';
import type { EnrollmentApiRecord } from './enrollment-mapper';
import type { LessonApiRecord } from './lesson-mapper';
import type { LiveSessionApiRecord } from './live-session-mapper';
import type { SubmissionApiRecord } from './submission-mapper';
import {
  buildStudentProgressOverview,
  mapEnrollmentToStudentCourseCard,
  mapStudentAssignment,
  mapStudentAttendanceStatus,
  mapStudentAttendanceSummary,
  mapStudentDashboard,
  mapStudentLessonPlayer,
  mapStudentLiveClass,
  mapStudentProfile,
} from './student-mapper';
import { mapLessonProgressApiToDto } from './lesson-progress-mapper';

const enrollment: EnrollmentApiRecord = {
  id: 'enr-1',
  organizationId: 'org-1',
  courseId: 'course-1',
  batchId: 'batch-1',
  studentId: 'student-1',
  status: 'ACTIVE',
  enrolledAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const lessons: LessonApiRecord[] = [
  {
    id: 'lesson-1',
    organizationId: 'org-1',
    moduleId: 'module-1',
    title: 'Intro',
    description: 'Start here',
    contentType: 'VIDEO',
    contentUrl: 'https://example.com/video',
    durationSeconds: 600,
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'lesson-2',
    organizationId: 'org-1',
    moduleId: 'module-1',
    title: 'Practice',
    description: null,
    contentType: 'PDF',
    contentUrl: null,
    durationSeconds: null,
    displayOrder: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('student mapper', () => {
  it('derives course progress honestly from lesson progress records', () => {
    const progress = [
      mapLessonProgressApiToDto({
        id: 'p1',
        organizationId: 'org-1',
        lessonId: 'lesson-1',
        studentId: 'student-1',
        status: 'COMPLETED',
        progressPercent: 100,
        lastPositionSeconds: null,
        completedAt: '2026-01-03T00:00:00.000Z',
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      }),
    ];

    const card = mapEnrollmentToStudentCourseCard(
      enrollment,
      {
        id: 'course-1',
        slug: 'foundations',
        title: 'Foundations',
        description: 'Basics',
      },
      { id: 'batch-1', name: 'Weekend' },
      lessons,
      progress,
    );

    expect(card.progress.completedLessons).toBe(1);
    expect(card.progress.totalLessons).toBe(2);
    expect(card.progress.percentage).toBe(50);
    expect(card.progress.resumeLessonId).toBe('lesson-2');
    expect(card.learningStatus).toBe('in_progress');
  });

  it('builds lesson player navigation and preserves contentUrl', () => {
    const player = mapStudentLessonPlayer(
      {
        id: 'course-1',
        slug: 'foundations',
        title: 'Foundations',
        description: 'Basics',
      },
      lessons,
      [],
      'lesson-1',
    );

    expect(player?.lesson.contentUrl).toBe('https://example.com/video');
    expect(player?.lesson.navigation.nextLessonId).toBe('lesson-2');
    expect(player?.lesson.navigation.previousLessonId).toBeNull();
    expect(player?.capabilities.lessonNotes).toBe('coming_soon');
  });

  it('maps assignment instructions and own submission grade/feedback', () => {
    const assignment: AssignmentApiRecord = {
      id: 'asg-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: 'batch-1',
      title: 'Worksheet',
      instructions: 'Complete the worksheet',
      status: 'PUBLISHED',
      maxScore: 100,
      dueAt: '2026-07-20T00:00:00.000Z',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      deletedAt: null,
    };
    const submission: SubmissionApiRecord = {
      id: 'sub-1',
      organizationId: 'org-1',
      assignmentId: 'asg-1',
      studentId: 'student-1',
      status: 'GRADED',
      content: 'My answer',
      attachments: ['file-a'],
      score: 88,
      feedback: 'Well done',
      submittedAt: '2026-07-05T00:00:00.000Z',
      gradedAt: '2026-07-06T00:00:00.000Z',
      gradedById: 'teacher-1',
      createdAt: '2026-07-05T00:00:00.000Z',
      updatedAt: '2026-07-06T00:00:00.000Z',
    };

    const dto = mapStudentAssignment(
      assignment,
      {
        id: 'course-1',
        slug: 'foundations',
        title: 'Foundations',
        description: '',
      },
      { id: 'batch-1', name: 'Weekend' },
      submission,
    );

    expect(dto.instructions).toBe('Complete the worksheet');
    expect(dto.submission?.score).toBe(88);
    expect(dto.submission?.feedback).toBe('Well done');
    expect(dto.capabilities.fileUploads).toBe('available');
  });

  it('preserves late/excused attendance statuses', () => {
    expect(mapStudentAttendanceStatus('LATE')).toBe('late');
    expect(mapStudentAttendanceStatus('EXCUSED')).toBe('excused');

    const records: AttendanceApiRecord[] = [
      {
        id: 'att-1',
        organizationId: 'org-1',
        liveSessionId: 'live-1',
        studentId: 'student-1',
        status: 'LATE',
        markedAt: '2026-07-10T10:00:00.000Z',
        notes: null,
        createdAt: '2026-07-10T10:00:00.000Z',
        updatedAt: '2026-07-10T10:00:00.000Z',
      },
      {
        id: 'att-2',
        organizationId: 'org-1',
        liveSessionId: 'live-2',
        studentId: 'student-1',
        status: 'ABSENT',
        markedAt: '2026-07-11T10:00:00.000Z',
        notes: null,
        createdAt: '2026-07-11T10:00:00.000Z',
        updatedAt: '2026-07-11T10:00:00.000Z',
      },
    ];

    const summary = mapStudentAttendanceSummary(
      records,
      new Map([
        [
          'live-1',
          {
            id: 'live-1',
            title: 'Session A',
            startsAt: '2026-07-10T09:00:00.000Z',
            endsAt: '2026-07-10T10:00:00.000Z',
            courseId: 'course-1',
            courseSlug: 'foundations',
            courseTitle: 'Foundations',
            batchId: 'batch-1',
            batchName: 'Weekend',
          },
        ],
      ]),
      { total: 2, page: 1, limit: 20, totalPages: 1 },
    );

    expect(summary.lateCount).toBe(1);
    expect(summary.absentCount).toBe(1);
    expect(summary.attendancePercent).toBe(50);
    expect(summary.records[0]?.status).toBe('late');
  });

  it('keeps meetingUrl and recordingUrl on live classes', () => {
    const session: LiveSessionApiRecord = {
      id: 'live-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      title: 'Live A',
      description: 'Join now',
      status: 'LIVE',
      meetingProvider: 'ZOOM',
      meetingUrl: 'https://zoom.example/j/1',
      recordingUrl: null,
      startsAt: '2026-07-18T10:00:00.000Z',
      endsAt: '2026-07-18T11:00:00.000Z',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-18T10:00:00.000Z',
    };

    const dto = mapStudentLiveClass(
      session,
      {
        id: 'course-1',
        slug: 'foundations',
        title: 'Foundations',
        description: '',
      },
      { id: 'batch-1', name: 'Weekend' },
      'present',
    );

    expect(dto.meeting.meetingUrl).toBe('https://zoom.example/j/1');
    expect(dto.capabilities.joinMeeting).toBe('available');
    expect(dto.capabilities.recordingPlayback).toBe('disabled');
  });

  it('does not fabricate dashboard attendance when records are empty', () => {
    const dashboard = mapStudentDashboard({
      welcomeName: 'Ada',
      courses: [],
      liveClasses: [],
      assignments: [],
      notifications: [],
      calendarEvents: [],
      certificates: [],
      attendancePercent: null,
    });

    expect(dashboard.welcomeName).toBe('Ada');
    expect(dashboard.attendancePercent).toBeNull();
    expect(dashboard.stats.find((stat) => stat.id === 'attendance')?.value).toBeNull();
    expect(dashboard.capabilities.pdfGeneration).toBe('available');
    expect(dashboard.capabilities.qrGeneration).toBe('available');
    expect(dashboard.capabilities.cloudinaryMedia).toBe('available');
  });

  it('builds progress overview and profile from auth only', () => {
    const overview = buildStudentProgressOverview([], 2);
    expect(overview.percentage).toBeNull();
    expect(overview.milestones).toBeNull();
    expect(overview.certificatesUnlocked).toBe(2);

    const user: AuthSessionUser = {
      id: 'user-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      roles: ['Student'],
      permissions: [],
      organizationIds: ['org-1'],
      profileImage: 'https://res.cloudinary.com/demo/image/upload/avatar.webp',
    };

    const profile = mapStudentProfile(user);
    expect(profile.firstName).toBe('Ada');
    expect(profile.avatarUrl).toBe('https://res.cloudinary.com/demo/image/upload/avatar.webp');
    expect(profile.learning).toBeNull();
    expect(profile.preferences.language).toBeNull();
  });
});
