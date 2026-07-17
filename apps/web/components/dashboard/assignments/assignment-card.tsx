import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import {
  assignmentPriorityLabel,
  assignmentsPageCopy,
  formatAssignmentDate,
  type AssignmentDto,
} from '../../../lib/dashboard';
import { AssignmentProgress } from './assignment-progress';
import { AssignmentStatusBadge } from './assignment-status-badge';

export function AssignmentCard({
  assignment,
  selected = false,
  onSelect,
}: {
  assignment: AssignmentDto;
  selected?: boolean;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  return (
    <Card
      className={
        selected
          ? 'flex h-full flex-col rounded-xl shadow-sm ring-2 ring-ring'
          : 'flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md'
      }
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <AssignmentStatusBadge status={assignment.status} />
          <Badge variant="neutral">{assignmentPriorityLabel[assignment.priority]}</Badge>
        </div>
        <CardDescription>{assignment.courseTitle}</CardDescription>
        <CardTitle className="text-base leading-snug">{assignment.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <dl className="grid gap-2 text-small text-muted-foreground">
          <div className="flex justify-between gap-3">
            <dt>{assignmentsPageCopy.dueLabel}</dt>
            <dd className="text-right text-foreground">
              {formatAssignmentDate(assignment.dueDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{assignmentsPageCopy.durationLabel}</dt>
            <dd className="text-right text-foreground">{assignment.estimatedDuration.label}</dd>
          </div>
        </dl>
        <AssignmentProgress progress={assignment.progress} />
      </CardContent>

      <CardFooter>
        <Button
          type="button"
          variant={selected ? 'primary' : 'outline'}
          size="md"
          className="w-full"
          aria-pressed={selected}
          onClick={() => {
            onSelect(assignment.id);
          }}
        >
          {assignmentsPageCopy.viewDetails}
        </Button>
      </CardFooter>
    </Card>
  );
}
