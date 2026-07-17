import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherLiveClassDateTime,
  teacherLiveClassesPageCopy,
  type TeacherLiveClassDto,
  type TeacherLiveClassesViewMode,
} from '../../../lib/teacher';
import { LiveClassStatusBadge, MeetingStatusBadge } from './live-class-badges';

function LiveClassSchedule({
  session,
}: {
  session: TeacherLiveClassDto;
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;
  const rows = [
    { id: 'course', label: copy.courseLabel, value: session.course.title },
    { id: 'batch', label: copy.batchLabel, value: session.batch.name },
    {
      id: 'start',
      label: copy.startsAtLabel,
      value: formatTeacherLiveClassDateTime(session.startsAt),
    },
    {
      id: 'end',
      label: copy.endsAtLabel,
      value: formatTeacherLiveClassDateTime(session.endsAt),
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

function LiveClassMetrics({
  session,
  className,
}: {
  session: TeacherLiveClassDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;

  return (
    <dl className={cn('grid grid-cols-1 gap-2 text-caption tablet:grid-cols-3', className)}>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <dt className="text-muted-foreground">{copy.meetingProviderLabel}</dt>
        <dd className="text-right font-medium text-foreground">{session.meeting.provider}</dd>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <dt className="text-muted-foreground">{copy.meetingStatusLabel}</dt>
        <dd>
          <MeetingStatusBadge status={session.meeting.status} />
        </dd>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <dt className="text-muted-foreground">{copy.studentsEnrolledLabel}</dt>
        <dd className="text-right font-medium text-foreground">
          {String(session.batch.studentsEnrolled)}
        </dd>
      </div>
    </dl>
  );
}

function LiveClassActions({
  session,
  onSelect,
}: {
  session: TeacherLiveClassDto;
  onSelect?: (sessionId: string) => void;
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;
  const actions = [
    { id: 'start', label: copy.startButton },
    { id: 'edit', label: copy.editScheduleButton },
    { id: 'cancel', label: copy.cancelSessionButton },
    { id: 'attendance', label: copy.attendanceButton },
    { id: 'recording', label: copy.recordingButton },
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
      <div className="grid gap-2 tablet:grid-cols-2 laptop:grid-cols-5">
        {actions.map((action) => (
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

/** Reusable live-class card with equivalent grid and list presentations. */
export function LiveClassCard({
  session,
  layout = 'grid',
  selected = false,
  onSelect,
}: {
  session: TeacherLiveClassDto;
  layout?: TeacherLiveClassesViewMode;
  selected?: boolean;
  onSelect?: (sessionId: string) => void;
}): React.JSX.Element {
  const selectedRing = selected ? 'ring-2 ring-primary ring-offset-2' : '';

  if (layout === 'list') {
    return (
      <Card
        className={cn(
          'rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md',
          selectedRing,
        )}
      >
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 laptop:flex-row laptop:items-start">
            <div className="min-w-0 flex-1 space-y-2">
              <LiveClassStatusBadge status={session.status} />
              <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
              <p className="text-small text-muted-foreground">{session.course.title}</p>
            </div>
            <LiveClassMetrics session={session} className="w-full laptop:max-w-2xl" />
          </div>
          <LiveClassSchedule session={session} />
          <LiveClassActions session={session} onSelect={onSelect} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md',
        selectedRing,
      )}
    >
      <CardHeader className="space-y-2 p-5 pb-0">
        <LiveClassStatusBadge status={session.status} />
        <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <LiveClassSchedule session={session} />
        <LiveClassMetrics session={session} />
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <LiveClassActions session={session} onSelect={onSelect} />
      </CardFooter>
    </Card>
  );
}
