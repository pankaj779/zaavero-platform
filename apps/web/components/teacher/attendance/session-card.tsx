import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatAttendanceDate,
  teacherAttendancePageCopy,
  type AttendanceSessionDto,
  type TeacherAttendanceViewMode,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';
import { SessionStatusBadge } from './session-status-badge';

function SessionMetrics({
  session,
  className,
}: {
  session: AttendanceSessionDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherAttendancePageCopy;
  const percent = session.counts.attendancePercent;
  const metrics = [
    {
      id: 'total-students',
      label: copy.totalStudentsLabel,
      value: String(session.counts.totalStudents),
    },
    { id: 'present', label: copy.presentLabel, value: String(session.counts.present) },
    { id: 'absent', label: copy.absentLabel, value: String(session.counts.absent) },
    {
      id: 'attendance',
      label: copy.attendanceLabel,
      value: percent === null ? '—' : `${String(percent)}%`,
    },
  ];

  return (
    <dl className={cn('grid grid-cols-2 gap-2 text-caption laptop:grid-cols-4', className)}>
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

function SessionSummary({ session }: { session: AttendanceSessionDto }): React.JSX.Element {
  const copy = teacherAttendancePageCopy;
  const rows = [
    { id: 'course', label: copy.courseLabel, value: session.course.title },
    { id: 'batch', label: copy.batchLabel, value: session.batch.name },
    { id: 'mentor', label: copy.mentorLabel, value: session.mentor.name },
    {
      id: 'session-date',
      label: copy.sessionDateLabel,
      value: formatAttendanceDate(session.sessionDate),
    },
    {
      id: 'duration',
      label: copy.durationLabel,
      value: `${String(session.durationMinutes)} min`,
    },
  ];

  return (
    <dl className="grid gap-2 text-small">
      {rows.map((row) => (
        <div key={row.id} className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-right font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SessionActions({
  session,
  onSelect,
}: {
  session: AttendanceSessionDto;
  onSelect?: (sessionId: string) => void;
}): React.JSX.Element {
  const copy = teacherAttendancePageCopy;
  const disabledActions = [
    { id: 'mark', label: copy.markButton },
    { id: 'edit', label: copy.editButton },
    { id: 'export', label: copy.exportButton },
    { id: 'analytics', label: copy.analyticsButton },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={`${copy.detailsButton} — ${session.title}`}
        onClick={() => {
          onSelect?.(session.id);
        }}
      >
        {copy.detailsButton}
      </Button>
      <div className="grid gap-2 tablet:grid-cols-2 laptop:grid-cols-4">
        {disabledActions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label={`${action.label} — ${session.title} — coming soon`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

/**
 * Reusable attendance session card — renders in grid or list layout from the same DTO.
 * Selecting "View details" opens the shared session details panel.
 */
export function SessionCard({
  session,
  layout = 'grid',
  selected = false,
  onSelect,
}: {
  session: AttendanceSessionDto;
  layout?: TeacherAttendanceViewMode;
  selected?: boolean;
  onSelect?: (sessionId: string) => void;
}): React.JSX.Element {
  const selectedRing = selected ? 'ring-2 ring-primary ring-offset-2' : '';

  if (layout === 'list') {
    return (
      <Card className={cn(teacherCardSurfaceClass, selectedRing)}>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 laptop:flex-row laptop:items-start">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SessionStatusBadge status={session.status} />
              </div>
              <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
              <p className="text-small text-muted-foreground">{session.course.title}</p>
            </div>
            <SessionMetrics session={session} className="w-full laptop:max-w-xl" />
          </div>
          <SessionSummary session={session} />
          <SessionActions session={session} onSelect={onSelect} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-full flex-col', teacherCardSurfaceClass, selectedRing)}>
      <CardHeader className="space-y-2 p-5 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <SessionStatusBadge status={session.status} />
        </div>
        <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <SessionSummary session={session} />
        <SessionMetrics session={session} />
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <SessionActions session={session} onSelect={onSelect} />
      </CardFooter>
    </Card>
  );
}
