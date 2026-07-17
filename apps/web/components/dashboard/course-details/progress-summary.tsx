import { ProgressBar } from '@graphology/ui';
import {
  courseDetailsCopy,
  type CourseDetailsDto,
} from '../../../lib/dashboard';

export function ProgressSummary({ course }: { course: CourseDetailsDto }): React.JSX.Element {
  const { progress, meta } = course;

  return (
    <div className="space-y-3">
      <ProgressBar value={progress.percentage} label={courseDetailsCopy.progressLabel} />
      <dl className="grid gap-2 text-caption text-muted-foreground">
        <div className="flex items-start justify-between gap-3">
          <dt>{courseDetailsCopy.lessonsCompletedLabel}</dt>
          <dd className="text-foreground">
            {progress.completedLessons}/{progress.totalLessons}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt>{courseDetailsCopy.timeRemainingLabel}</dt>
          <dd className="text-right text-foreground">
            {progress.estimatedTimeRemaining ?? courseDetailsCopy.completedLabel}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt>{courseDetailsCopy.certificateStatusLabel}</dt>
          <dd className="text-right text-foreground">{meta.certificate.label}</dd>
        </div>
      </dl>
    </div>
  );
}
