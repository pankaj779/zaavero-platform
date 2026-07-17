import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  ProgressBar,
} from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherStudentDate,
  teacherStudentsPageCopy,
  type TeacherStudentSummaryDto,
  type TeacherStudentsViewMode,
} from '../../../lib/teacher';
import { StudentAvatar } from './student-avatar';
import { StudentStatusBadge } from './student-status-badge';

function StudentMetrics({
  student,
  className,
}: {
  student: TeacherStudentSummaryDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherStudentsPageCopy;
  const metrics = [
    {
      id: 'attendance',
      label: copy.attendanceLabel,
      value: `${String(student.progress.attendancePercent)}%`,
    },
    {
      id: 'assignments',
      label: copy.assignmentsLabel,
      value: `${String(student.progress.assignmentsCompleted)}/${String(
        student.progress.assignmentsTotal,
      )}`,
    },
    {
      id: 'joined',
      label: copy.joinedLabel,
      value: formatTeacherStudentDate(student.joinedAt),
    },
  ];

  return (
    <dl className={cn('grid grid-cols-1 gap-2 text-caption tablet:grid-cols-3', className)}>
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <dt className="text-muted-foreground">{metric.label}</dt>
          <dd className="text-right font-medium text-foreground">{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StudentActions({ studentName }: { studentName: string }): React.JSX.Element {
  const copy = teacherStudentsPageCopy;
  const actions = [
    { id: 'profile', label: copy.profileButton },
    { id: 'progress', label: copy.progressButton },
    { id: 'attendance', label: copy.attendanceButton },
    { id: 'message', label: copy.messageButton },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid gap-2 tablet:grid-cols-2 laptop:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label={`${action.label} ${studentName} — coming soon`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

function StudentSummary({ student }: { student: TeacherStudentSummaryDto }): React.JSX.Element {
  const copy = teacherStudentsPageCopy;

  return (
    <div className="space-y-3">
      <dl className="grid gap-2 text-small">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{copy.emailLabel}</dt>
          <dd className="break-all text-right font-medium text-foreground">{student.email}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{copy.batchLabel}</dt>
          <dd className="text-right font-medium text-foreground">{student.batch.name}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{copy.courseLabel}</dt>
          <dd className="text-right font-medium text-foreground">{student.course.title}</dd>
        </div>
      </dl>
      <ProgressBar
        value={student.progress.percentage}
        label={`${copy.progressLabel}: ${String(student.progress.percentage)}%`}
      />
    </div>
  );
}

/**
 * Reusable teacher student card — renders in grid or list layout from the same DTO.
 */
export function StudentCard({
  student,
  layout = 'grid',
}: {
  student: TeacherStudentSummaryDto;
  layout?: TeacherStudentsViewMode;
}): React.JSX.Element {
  const copy = teacherStudentsPageCopy;

  if (layout === 'list') {
    return (
      <Card className="rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 laptop:flex-row laptop:items-start">
            <StudentAvatar initials={student.initials} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StudentStatusBadge status={student.enrollmentStatus} />
                {student.isAtRisk ? <Badge variant="warning">{copy.atRiskLabel}</Badge> : null}
              </div>
              <CardTitle className="text-base leading-snug">{student.fullName}</CardTitle>
              <p className="text-small text-muted-foreground">{student.course.title}</p>
            </div>
            <StudentMetrics student={student} className="w-full laptop:max-w-xl" />
          </div>
          <StudentSummary student={student} />
          <StudentActions studentName={student.fullName} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md">
      <CardHeader className="space-y-4 p-5 pb-0">
        <div className="flex items-start gap-3">
          <StudentAvatar initials={student.initials} />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StudentStatusBadge status={student.enrollmentStatus} />
              {student.isAtRisk ? <Badge variant="warning">{copy.atRiskLabel}</Badge> : null}
            </div>
            <CardTitle className="text-base leading-snug">{student.fullName}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <StudentSummary student={student} />
        <StudentMetrics student={student} />
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <StudentActions studentName={student.fullName} />
      </CardFooter>
    </Card>
  );
}
