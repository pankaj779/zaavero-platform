import type {
  StudentCourseCardDto,
  StudentDashboardDto,
  StudentDashboardStatDto,
  TeacherNotificationDto,
} from '../../../lib/student';
import { studentHomeCopy } from './copy';

/** Display value for dashboard stats — never invent a number when the API cannot derive one. */
export function formatDashboardStatValue(value: string | null): string {
  return value ?? studentHomeCopy.missingValue;
}

export function mapDashboardStatsForDisplay(
  stats: StudentDashboardStatDto[],
): (StudentDashboardStatDto & { displayValue: string })[] {
  return stats.map((stat) => ({
    ...stat,
    displayValue: formatDashboardStatValue(stat.value),
  }));
}

/**
 * Overall lesson completion across enrolled courses.
 * Returns null when no lesson totals are available (honest empty).
 */
export function deriveOverallProgressPercent(courses: StudentCourseCardDto[]): number | null {
  const totalLessons = courses.reduce((sum, course) => sum + course.progress.totalLessons, 0);
  if (totalLessons === 0) {
    return null;
  }
  const completedLessons = courses.reduce(
    (sum, course) => sum + course.progress.completedLessons,
    0,
  );
  return Math.round((completedLessons / totalLessons) * 100);
}

export function countUnreadNotifications(notifications: TeacherNotificationDto[]): number {
  return notifications.filter((notification) => notification.readAt === null).length;
}

export function issuedCertificatesCount(dashboard: StudentDashboardDto): number {
  return dashboard.certificates.filter((certificate) => certificate.status === 'issued').length;
}

export function buildRecentActivityItems(
  notifications: TeacherNotificationDto[],
): { id: string; title: string; detail: string }[] {
  return notifications.slice(0, 8).map((notification) => ({
    id: notification.id,
    title: notification.title,
    detail: notification.readAt === null ? 'Unread' : 'Read',
  }));
}
