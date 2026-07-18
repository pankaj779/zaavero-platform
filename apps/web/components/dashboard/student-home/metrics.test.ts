import { describe, expect, it } from 'vitest';
import type {
  StudentCourseCardDto,
  StudentDashboardDto,
  TeacherNotificationDto,
} from '../../../lib/student';
import {
  buildRecentActivityItems,
  countUnreadNotifications,
  deriveOverallProgressPercent,
  formatDashboardStatValue,
  issuedCertificatesCount,
  mapDashboardStatsForDisplay,
} from './metrics';

function course(partial: { id: string; completed: number; total: number }): StudentCourseCardDto {
  return {
    enrollmentId: `enr-${partial.id}`,
    course: { id: partial.id, slug: partial.id, title: `Course ${partial.id}` },
    batch: { id: 'batch-1', name: 'Batch' },
    description: '',
    enrollmentStatus: 'active',
    learningStatus: 'in_progress',
    progress: {
      completedLessons: partial.completed,
      totalLessons: partial.total,
      percentage: partial.total === 0 ? 0 : Math.round((partial.completed / partial.total) * 100),
      resumeLessonId: null,
    },
    enrolledAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    lastProgressAt: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('student home metrics', () => {
  it('renders an em dash when attendance or other stats cannot be derived', () => {
    expect(formatDashboardStatValue(null)).toBe('—');
    expect(formatDashboardStatValue('42%')).toBe('42%');

    const mapped = mapDashboardStatsForDisplay([
      {
        id: 'attendance',
        label: 'Attendance',
        value: null,
        helper: 'No attendance records available yet.',
      },
      {
        id: 'enrolled-courses',
        label: 'Enrolled Courses',
        value: '0',
        helper: 'Courses from your enrollment records.',
      },
    ]);

    expect(mapped[0]?.displayValue).toBe('—');
    expect(mapped[1]?.displayValue).toBe('0');
  });

  it('derives overall progress only from real lesson totals', () => {
    expect(deriveOverallProgressPercent([])).toBeNull();
    expect(deriveOverallProgressPercent([course({ id: 'a', completed: 0, total: 0 })])).toBeNull();
    expect(
      deriveOverallProgressPercent([
        course({ id: 'a', completed: 1, total: 2 }),
        course({ id: 'b', completed: 1, total: 2 }),
      ]),
    ).toBe(50);
  });

  it('counts unread notifications and issued certificates honestly', () => {
    const notifications: TeacherNotificationDto[] = [
      {
        id: 'n1',
        userId: 'u1',
        title: 'Assignment due',
        message: 'Submit soon',
        type: 'assignment',
        priority: 'medium',
        createdAt: '2026-01-01T00:00:00.000Z',
        readAt: null,
        archivedAt: null,
        actionLabel: null,
        actionUrl: null,
        icon: 'bell',
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
      {
        id: 'n2',
        userId: 'u1',
        title: 'Class reminder',
        message: 'Starts soon',
        type: 'live_class',
        priority: 'low',
        createdAt: '2026-01-02T00:00:00.000Z',
        readAt: '2026-01-02T01:00:00.000Z',
        archivedAt: null,
        actionLabel: null,
        actionUrl: null,
        icon: 'bell',
        relatedFeatureLabel: 'Live',
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

    expect(countUnreadNotifications(notifications)).toBe(1);
    expect(buildRecentActivityItems(notifications)).toEqual([
      { id: 'n1', title: 'Assignment due', detail: 'Unread' },
      { id: 'n2', title: 'Class reminder', detail: 'Read' },
    ]);

    const dashboard = {
      certificates: [{ status: 'issued' }, { status: 'pending' }, { status: 'issued' }],
    } as StudentDashboardDto;

    expect(issuedCertificatesCount(dashboard)).toBe(2);
  });
});
