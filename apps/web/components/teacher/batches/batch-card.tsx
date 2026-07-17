import {
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
  formatTeacherBatchDate,
  formatTeacherBatchDateTime,
  teacherBatchesPageCopy,
  type TeacherBatchSummaryDto,
  type TeacherBatchesViewMode,
} from '../../../lib/teacher';
import { BatchStatusBadge } from './batch-status-badge';

function BatchMetrics({
  batch,
  className,
}: {
  batch: TeacherBatchSummaryDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherBatchesPageCopy;
  const metrics = [
    { id: 'students', label: copy.studentsLabel, value: batch.studentsEnrolled },
    { id: 'capacity', label: copy.capacityLabel, value: batch.capacity },
    { id: 'start-date', label: copy.startDateLabel, value: formatTeacherBatchDate(batch.startDate) },
    { id: 'end-date', label: copy.endDateLabel, value: formatTeacherBatchDate(batch.endDate) },
  ];

  return (
    <dl className={cn('grid grid-cols-2 gap-2 text-caption', className)}>
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

function BatchActions({ batchName }: { batchName: string }): React.JSX.Element {
  const copy = teacherBatchesPageCopy;
  const actions = [
    { id: 'view', label: copy.viewButton },
    { id: 'manage', label: copy.manageButton },
    { id: 'attendance', label: copy.attendanceButton },
    { id: 'analytics', label: copy.analyticsButton },
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
            aria-label={`${action.label} ${batchName} — coming soon`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

function BatchSummary({ batch }: { batch: TeacherBatchSummaryDto }): React.JSX.Element {
  const copy = teacherBatchesPageCopy;
  const nextLiveClass = batch.nextLiveClass
    ? `${batch.nextLiveClass.title} · ${formatTeacherBatchDateTime(batch.nextLiveClass.startsAt)}`
    : copy.noNextLiveClassLabel;

  return (
    <div className="space-y-3">
      <dl className="grid gap-2 text-small">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{copy.courseLabel}</dt>
          <dd className="text-right font-medium text-foreground">{batch.course.title}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{copy.mentorLabel}</dt>
          <dd className="text-right font-medium text-foreground">{batch.mentor.name}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{copy.nextLiveClassLabel}</dt>
          <dd className="text-right font-medium text-foreground">{nextLiveClass}</dd>
        </div>
      </dl>
      <ProgressBar
        value={batch.progress.percentage}
        label={`${copy.progressLabel}: ${String(batch.progress.completedLessons)} of ${String(
          batch.progress.totalLessons,
        )} lessons`}
      />
    </div>
  );
}

export function BatchCard({
  batch,
  layout = 'grid',
}: {
  batch: TeacherBatchSummaryDto;
  layout?: TeacherBatchesViewMode;
}): React.JSX.Element {
  const copy = teacherBatchesPageCopy;
  const updatedLabel = `${copy.lastUpdatedLabel}: ${formatTeacherBatchDate(batch.updatedAt)}`;

  if (layout === 'list') {
    return (
      <Card className="rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 laptop:flex-row laptop:items-start laptop:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <BatchStatusBadge status={batch.status} />
              </div>
              <CardTitle className="text-base leading-snug">{batch.name}</CardTitle>
              <p className="text-small text-muted-foreground">{batch.course.title}</p>
              <p className="text-caption text-muted-foreground">{updatedLabel}</p>
            </div>
            <BatchMetrics batch={batch} className="w-full laptop:max-w-xl laptop:grid-cols-4" />
          </div>
          <BatchSummary batch={batch} />
          <BatchActions batchName={batch.name} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md">
      <CardHeader className="space-y-3 p-5 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <BatchStatusBadge status={batch.status} />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-base leading-snug">{batch.name}</CardTitle>
          <p className="text-small text-muted-foreground">{batch.course.title}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <BatchMetrics batch={batch} />
        <BatchSummary batch={batch} />
        <p className="text-caption text-muted-foreground">{updatedLabel}</p>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <BatchActions batchName={batch.name} />
      </CardFooter>
    </Card>
  );
}
