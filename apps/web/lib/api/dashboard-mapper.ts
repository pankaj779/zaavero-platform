import { formatDashboardDateTime, formatDashboardRelativeTime } from '../dashboard/format-date';
import type {
  TeacherDashboardDto,
  TeacherDashboardItemDto,
  TeacherDashboardSectionDto,
} from '../teacher/dashboard-types';
import type { TeacherNotificationDto } from '../teacher/notification-types';
import type { TeacherAnalyticsSourceDto } from '../teacher/analytics-types';

function section(
  id: string,
  title: string,
  description: string,
  emptyLabel: string,
  items: TeacherDashboardItemDto[],
): TeacherDashboardSectionDto {
  return { id, title, description, emptyLabel, items };
}

export function mapTeacherDashboard(
  source: TeacherAnalyticsSourceDto,
  notifications: TeacherNotificationDto[],
  now = new Date(),
): TeacherDashboardDto {
  const activeCourses = source.courses.filter((course) => course.status === 'published').length;
  const activeStudents = source.students.filter(
    (student) => student.enrollmentStatus === 'active',
  ).length;
  const pendingReviews = source.submissions.filter(
    (submission) => submission.status === 'submitted' || submission.status === 'late',
  ).length;
  const upcomingSessions = source.liveSessions
    .filter(
      (session) =>
        new Date(session.startsAt).getTime() >= now.getTime() &&
        (session.status === 'scheduled' || session.status === 'live'),
    )
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const todaysSessions = source.liveSessions
    .filter((session) => new Date(session.startsAt).toDateString() === now.toDateString())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      title: session.title,
      detail: `${formatDashboardDateTime(session.startsAt)} · ${session.status}`,
    }));
  const upcomingAssignments = source.assignments
    .filter(
      (assignment) =>
        assignment.dueAt !== null &&
        new Date(assignment.dueAt).getTime() >= now.getTime() &&
        assignment.status !== 'closed' &&
        assignment.status !== 'archived',
    )
    .sort((left, right) => {
      const leftTime =
        left.dueAt === null ? Number.POSITIVE_INFINITY : new Date(left.dueAt).getTime();
      const rightTime =
        right.dueAt === null ? Number.POSITIVE_INFINITY : new Date(right.dueAt).getTime();
      return leftTime - rightTime;
    })
    .slice(0, 5)
    .map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      detail:
        assignment.dueAt === null
          ? 'No due date'
          : `Due ${formatDashboardDateTime(assignment.dueAt)}`,
    }));
  const recentNotifications = [...notifications]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      detail: `${notification.message} · ${formatDashboardRelativeTime(notification.createdAt)}`,
    }));

  return {
    stats: [
      {
        id: 'active-courses',
        label: 'Active Courses',
        value: String(activeCourses),
        helper: 'Published courses in the active organization.',
        icon: 'book',
      },
      {
        id: 'total-students',
        label: 'Active Students',
        value: String(activeStudents),
        helper: 'Active enrollment records in your teaching scope.',
        icon: 'users',
      },
      {
        id: 'pending-reviews',
        label: 'Pending Reviews',
        value: String(pendingReviews),
        helper: 'Submitted or late work awaiting review.',
        icon: 'clipboard',
      },
      {
        id: 'upcoming-classes',
        label: 'Upcoming Classes',
        value: String(upcomingSessions.length),
        helper: 'Scheduled live sessions from now onward.',
        icon: 'video',
      },
    ],
    todaysClasses: section(
      'todays-classes',
      "Today's Classes",
      'Live sessions scheduled for today.',
      'No classes scheduled today',
      todaysSessions,
    ),
    upcomingWork: section(
      'upcoming-work',
      'Upcoming Work',
      'The next assignment deadlines in your scope.',
      'No upcoming deadlines',
      upcomingAssignments,
    ),
    recentActivity: section(
      'recent-activity',
      'Recent Activity',
      'Your latest in-app notifications.',
      'No recent activity',
      recentNotifications,
    ),
  };
}
