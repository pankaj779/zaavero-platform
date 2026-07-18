import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherSubmissionDate,
  teacherSubmissionsPageCopy,
  type TeacherSubmissionSummaryDto,
  type TeacherSubmissionsViewMode,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';
import { SubmissionStatusBadge } from './submission-status-badge';

function SubmissionSummary({
  submission,
}: {
  submission: TeacherSubmissionSummaryDto;
}): React.JSX.Element {
  const copy = teacherSubmissionsPageCopy;
  const rows = [
    { id: 'student', label: copy.studentLabel, value: submission.student.fullName },
    { id: 'assignment', label: copy.assignmentLabel, value: submission.assignment.title },
    { id: 'course', label: copy.courseLabel, value: submission.assignment.course.title },
    {
      id: 'submitted',
      label: copy.submittedAtLabel,
      value:
        submission.submittedAt === null
          ? copy.notSubmittedLabel
          : formatTeacherSubmissionDate(submission.submittedAt),
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

function SubmissionMetrics({
  submission,
  className,
}: {
  submission: TeacherSubmissionSummaryDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherSubmissionsPageCopy;
  const maxScore = submission.assignment.maxScore;
  const metrics = [
    {
      id: 'score',
      label: copy.scoreLabel,
      value: submission.score === null ? copy.noScoreLabel : String(submission.score),
    },
    {
      id: 'max',
      label: copy.maxScoreLabel,
      value: maxScore === null ? copy.noScoreLabel : String(maxScore),
    },
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

function SubmissionActions({
  submission,
  onSelect,
}: {
  submission: TeacherSubmissionSummaryDto;
  onSelect?: (submissionId: string) => void;
}): React.JSX.Element {
  const copy = teacherSubmissionsPageCopy;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          onSelect?.(submission.id);
        }}
      >
        {copy.detailsButton}
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          onSelect?.(submission.id);
        }}
      >
        {copy.gradeButton}
      </Button>
    </div>
  );
}

export function SubmissionCard({
  submission,
  layout = 'grid',
  selected = false,
  onSelect,
}: {
  submission: TeacherSubmissionSummaryDto;
  layout?: TeacherSubmissionsViewMode;
  selected?: boolean;
  onSelect?: (submissionId: string) => void;
}): React.JSX.Element {
  const isList = layout === 'list';

  return (
    <Card
      className={cn(
        teacherCardSurfaceClass,
        'h-full',
        selected && 'ring-2 ring-primary/40',
        isList && 'tablet:flex tablet:flex-row tablet:items-stretch',
      )}
    >
      <div className={cn('flex h-full flex-1 flex-col', isList && 'tablet:min-w-0 tablet:flex-1')}>
        <CardHeader className="space-y-3 p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <SubmissionStatusBadge status={submission.status} />
            <span className="text-caption text-muted-foreground">
              {submission.student.initials}
            </span>
          </div>
          <CardTitle className="text-base font-semibold leading-snug text-foreground">
            {submission.assignment.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0">
          <SubmissionSummary submission={submission} />
          <SubmissionMetrics submission={submission} />
        </CardContent>
        <CardFooter className="p-5 pt-0">
          <SubmissionActions submission={submission} onSelect={onSelect} />
        </CardFooter>
      </div>
    </Card>
  );
}
