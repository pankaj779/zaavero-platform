import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherAssignmentDate,
  teacherAssignmentsPageCopy,
  type TeacherAssignmentDto,
  type TeacherAssignmentsViewMode,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';
import { AssignmentStatusBadge } from './assignment-status-badge';

function batchLabel(assignment: TeacherAssignmentDto): string {
  const [first] = assignment.batches;
  if (!first) {
    return '—';
  }
  const extra = assignment.batches.length - 1;
  return extra > 0 ? `${first.name} +${String(extra)}` : first.name;
}

function AssignmentSummary({
  assignment,
}: {
  assignment: TeacherAssignmentDto;
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  const rows = [
    { id: 'course', label: copy.courseLabel, value: assignment.course.title },
    { id: 'batch', label: copy.batchLabel, value: batchLabel(assignment) },
    {
      id: 'due',
      label: copy.dueDateLabel,
      value:
        assignment.dueAt === null
          ? copy.noDueDateLabel
          : formatTeacherAssignmentDate(assignment.dueAt),
    },
    {
      id: 'updated',
      label: copy.lastUpdatedLabel,
      value: formatTeacherAssignmentDate(assignment.updatedAt),
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

function AssignmentMetrics({
  assignment,
  className,
}: {
  assignment: TeacherAssignmentDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  const metrics = [
    {
      id: 'total',
      label: copy.totalStudentsLabel,
      value: String(assignment.submissions.totalStudents),
    },
    {
      id: 'submitted',
      label: copy.submittedLabel,
      value: String(assignment.submissions.submitted),
    },
    { id: 'pending', label: copy.pendingLabel, value: String(assignment.submissions.pending) },
    { id: 'graded', label: copy.gradedLabel, value: String(assignment.submissions.graded) },
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

function AssignmentActions({
  assignment,
  onSelect,
}: {
  assignment: TeacherAssignmentDto;
  onSelect?: (assignmentId: string) => void;
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  const actions = [
    { id: 'edit', label: copy.editButton },
    { id: 'review', label: copy.reviewButton },
    { id: 'publish', label: copy.publishButton },
    { id: 'archive', label: copy.archiveButton },
    { id: 'analytics', label: copy.analyticsButton },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={`${copy.detailsButton} — ${assignment.title}`}
        onClick={() => {
          onSelect?.(assignment.id);
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
            aria-label={`${action.label} — ${assignment.title} — coming soon`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

/** Reusable assignment card with equivalent grid and list presentations. */
export function AssignmentCard({
  assignment,
  layout = 'grid',
  selected = false,
  onSelect,
}: {
  assignment: TeacherAssignmentDto;
  layout?: TeacherAssignmentsViewMode;
  selected?: boolean;
  onSelect?: (assignmentId: string) => void;
}): React.JSX.Element {
  const selectedRing = selected ? 'ring-2 ring-primary ring-offset-2' : '';

  if (layout === 'list') {
    return (
      <Card className={cn(teacherCardSurfaceClass, selectedRing)}>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 laptop:flex-row laptop:items-start">
            <div className="min-w-0 flex-1 space-y-2">
              <AssignmentStatusBadge status={assignment.status} />
              <CardTitle className="text-base leading-snug">{assignment.title}</CardTitle>
              <p className="text-small text-muted-foreground">{assignment.course.title}</p>
            </div>
            <AssignmentMetrics assignment={assignment} className="w-full laptop:max-w-2xl" />
          </div>
          <AssignmentSummary assignment={assignment} />
          <AssignmentActions assignment={assignment} onSelect={onSelect} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-full flex-col', teacherCardSurfaceClass, selectedRing)}>
      <CardHeader className="space-y-2 p-5 pb-0">
        <AssignmentStatusBadge status={assignment.status} />
        <CardTitle className="text-base leading-snug">{assignment.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <AssignmentSummary assignment={assignment} />
        <AssignmentMetrics assignment={assignment} />
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <AssignmentActions assignment={assignment} onSelect={onSelect} />
      </CardFooter>
    </Card>
  );
}
