import { describe, expect, it } from 'vitest';
import type { TeacherAnalyticsSourceDto } from '../teacher/analytics-types';
import type { TeacherNotificationDto } from '../teacher/notification-types';
import { mapTeacherDashboard } from './dashboard-mapper';

describe('mapTeacherDashboard', () => {
  it('derives dashboard stats and sections from live module data', () => {
    const source: TeacherAnalyticsSourceDto = {
      courses: [
        {
          id: 'course-1',
          slug: 'foundations',
          title: 'Foundations',
          description: 'Course',
          status: 'published',
          isPublished: true,
          media: { thumbnailUrl: null, thumbnailAlt: 'Foundations' },
          counts: { batches: 1, students: 1, lessons: 1, assignments: 1 },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      students: [
        {
          id: 'enr-1',
          fullName: 'Student',
          email: '',
          avatarUrl: null,
          initials: 'ST',
          batch: { id: 'batch-1', name: 'Batch A' },
          course: { id: 'course-1', slug: 'foundations', title: 'Foundations' },
          enrollmentStatus: 'active',
          isAtRisk: false,
          progress: {
            percentage: 0,
            assignmentsCompleted: 0,
            assignmentsTotal: 0,
            attendancePercent: 0,
          },
          joinedAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      assignments: [],
      submissions: [
        {
          id: 'sub-1',
          assignment: {
            id: 'asg-1',
            title: 'Essay',
            course: { id: 'course-1', slug: 'foundations', title: 'Foundations' },
            maxScore: 100,
          },
          student: {
            id: 'student-1',
            fullName: 'Student',
            initials: 'ST',
            avatarUrl: null,
          },
          status: 'submitted',
          content: 'Work',
          attachments: [],
          score: null,
          feedback: null,
          submittedAt: '2026-07-17T10:00:00.000Z',
          gradedAt: null,
          grader: null,
          updatedAt: '2026-07-17T10:00:00.000Z',
        },
      ],
      attendanceSessions: [],
      liveSessions: [
        {
          id: 'live-1',
          title: 'Morning Session',
          course: { id: 'course-1', slug: 'foundations', title: 'Foundations' },
          batch: { id: 'batch-1', name: 'Batch A', studentsEnrolled: 1 },
          mentor: { id: 'teacher-1', name: 'Teacher' },
          startsAt: '2026-07-18T09:00:00.000Z',
          endsAt: '2026-07-18T10:00:00.000Z',
          durationMinutes: 60,
          status: 'scheduled',
          meeting: {
            provider: 'Zoom',
            status: 'ready',
            meetingUrl: null,
          },
          attendance: {
            totalStudents: 1,
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
          updatedAt: '2026-07-17T00:00:00.000Z',
        },
      ],
      certificates: [],
    };

    const notifications: TeacherNotificationDto[] = [
      {
        id: 'n1',
        userId: 'teacher-1',
        title: 'New submission',
        message: 'A learner submitted work',
        type: 'assignment',
        priority: 'medium',
        createdAt: '2026-07-18T08:00:00.000Z',
        readAt: null,
        archivedAt: null,
        actionLabel: null,
        actionUrl: null,
        icon: 'clipboard',
        relatedFeatureLabel: 'Assignments',
        futureFeatures: {
          realtimeEnabled: false,
          emailEnabled: false,
          pushEnabled: false,
          websocketsEnabled: false,
          preferencesEnabled: false,
          deepLinkingEnabled: false,
          readReceiptsEnabled: false,
        },
      },
    ];

    const dashboard = mapTeacherDashboard(
      source,
      notifications,
      new Date('2026-07-18T12:00:00.000Z'),
    );

    expect(dashboard.stats.find((stat) => stat.id === 'active-courses')?.value).toBe('1');
    expect(dashboard.stats.find((stat) => stat.id === 'pending-reviews')?.value).toBe('1');
    expect(dashboard.todaysClasses.items[0]?.title).toBe('Morning Session');
    expect(dashboard.recentActivity.items[0]?.title).toBe('New submission');
  });
});
