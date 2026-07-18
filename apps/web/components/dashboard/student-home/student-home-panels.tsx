import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import Link from 'next/link';
import { DASHBOARD_ROUTES, getCourseDetailsPath } from '../../../lib/constants';
import { formatDashboardDate, formatDashboardDateTime } from '../../../lib/dashboard/format-date';
import type {
  StudentAssignmentDto,
  StudentCertificateDto,
  StudentCourseCardDto,
  TeacherCalendarEventDto,
  TeacherNotificationDto,
} from '../../../lib/student';
import { studentHomeCopy } from './copy';
import {
  countUnreadNotifications,
  deriveOverallProgressPercent,
  formatDashboardStatValue,
} from './metrics';
import { StudentSectionCard } from './student-section-card';

const quickLinks = [
  { href: DASHBOARD_ROUTES.learning, label: 'My Courses' },
  { href: DASHBOARD_ROUTES.liveClasses, label: 'Live Classes' },
  { href: DASHBOARD_ROUTES.assignments, label: 'Assignments' },
  { href: DASHBOARD_ROUTES.attendance, label: 'Attendance' },
  { href: DASHBOARD_ROUTES.certificates, label: 'Certificates' },
  { href: DASHBOARD_ROUTES.payments, label: 'Payments' },
  { href: DASHBOARD_ROUTES.calendar, label: 'Calendar' },
  { href: DASHBOARD_ROUTES.notifications, label: 'Notifications' },
  { href: DASHBOARD_ROUTES.messages, label: 'Messages' },
  { href: DASHBOARD_ROUTES.profile, label: 'Profile' },
  { href: DASHBOARD_ROUTES.settings, label: 'Settings' },
] as const;

export function StudentOverallProgress({
  courses,
}: {
  courses: StudentCourseCardDto[];
}): React.JSX.Element {
  const percent = deriveOverallProgressPercent(courses);
  const display = formatDashboardStatValue(percent === null ? null : `${String(percent)}%`);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{studentHomeCopy.overallProgressTitle}</CardTitle>
        <CardDescription>{studentHomeCopy.overallProgressDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {percent === null ? (
          <p className="text-small text-muted-foreground">{studentHomeCopy.overallProgressEmpty}</p>
        ) : (
          <p className="text-3xl font-semibold tracking-tight text-foreground">{display}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentCoursesPanel({
  courses,
}: {
  courses: StudentCourseCardDto[];
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{studentHomeCopy.coursesTitle}</CardTitle>
        <CardDescription>{studentHomeCopy.coursesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-small text-muted-foreground">{studentHomeCopy.coursesEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {courses.slice(0, 5).map((course) => {
              const href = getCourseDetailsPath(course.course.id);
              return (
                <li
                  key={course.enrollmentId}
                  className="rounded-lg border border-border bg-surface px-3 py-3"
                >
                  <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{course.course.title}</p>
                      <p className="text-caption text-muted-foreground">
                        {course.batch.name} ·{' '}
                        {studentHomeCopy.lessonsProgress(
                          course.progress.completedLessons,
                          course.progress.totalLessons,
                        )}{' '}
                        · {course.progress.percentage}%
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={href}>{studentHomeCopy.continueCourse}</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentAssignmentsPanel({
  assignments,
}: {
  assignments: StudentAssignmentDto[];
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{studentHomeCopy.assignmentsTitle}</CardTitle>
        <CardDescription>{studentHomeCopy.assignmentsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-small text-muted-foreground">{studentHomeCopy.assignmentsEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="rounded-lg border border-border bg-surface px-3 py-3"
              >
                <p className="text-sm font-medium text-foreground">{assignment.title}</p>
                <p className="text-caption text-muted-foreground">
                  {assignment.course.title}
                  {assignment.dueAt
                    ? ` · ${studentHomeCopy.duePrefix} ${formatDashboardDateTime(assignment.dueAt, studentHomeCopy.missingValue)}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentCertificatesPanel({
  certificates,
}: {
  certificates: StudentCertificateDto[];
}): React.JSX.Element {
  const issued = certificates.filter((certificate) => certificate.status === 'issued');

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{studentHomeCopy.certificatesTitle}</CardTitle>
        <CardDescription>{studentHomeCopy.certificatesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {issued.length === 0 ? (
          <p className="text-small text-muted-foreground">{studentHomeCopy.certificatesEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {issued.map((certificate) => (
              <li
                key={certificate.id}
                className="rounded-lg border border-border bg-surface px-3 py-3"
              >
                <p className="text-sm font-medium text-foreground">{certificate.course.title}</p>
                <p className="text-caption text-muted-foreground">
                  {certificate.certificateNumber ?? certificate.status}
                  {certificate.issuedAt
                    ? ` · ${studentHomeCopy.issuedPrefix} ${formatDashboardDate(certificate.issuedAt, studentHomeCopy.missingValue)}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentNotificationsPanel({
  notifications,
}: {
  notifications: TeacherNotificationDto[];
}): React.JSX.Element {
  const unread = countUnreadNotifications(notifications);

  return (
    <StudentSectionCard
      title={studentHomeCopy.notificationsTitle}
      description={studentHomeCopy.notificationsDescription}
      emptyLabel={studentHomeCopy.notificationsEmpty}
      headerExtra={
        unread > 0 ? <Badge variant="secondary">{studentHomeCopy.unreadLabel(unread)}</Badge> : null
      }
      items={notifications.slice(0, 8).map((notification) => ({
        id: notification.id,
        title: notification.title,
        detail: notification.readAt === null ? 'Unread' : 'Read',
      }))}
    />
  );
}

export function StudentCalendarPreview({
  events,
}: {
  events: TeacherCalendarEventDto[];
}): React.JSX.Element {
  return (
    <StudentSectionCard
      title={studentHomeCopy.calendarTitle}
      description={studentHomeCopy.calendarDescription}
      emptyLabel={studentHomeCopy.calendarEmpty}
      items={events.slice(0, 8).map((event) => ({
        id: event.id,
        title: event.title,
        detail: `${formatDashboardDateTime(event.startTime, studentHomeCopy.missingValue)} · ${event.type}`,
      }))}
    />
  );
}

export function StudentQuickLinks(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{studentHomeCopy.quickLinksTitle}</CardTitle>
        <CardDescription>{studentHomeCopy.quickLinksDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 tablet:grid-cols-2 laptop:grid-cols-5">
          {quickLinks.map((link) => (
            <li key={link.href}>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function StudentCapabilityNotice(): React.JSX.Element {
  return (
    <Card className="rounded-xl border-dashed shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{studentHomeCopy.capabilityTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-small text-muted-foreground">{studentHomeCopy.capabilityDescription}</p>
      </CardContent>
    </Card>
  );
}
