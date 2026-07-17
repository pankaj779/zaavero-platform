import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import {
  assignmentPriorityLabel,
  assignmentsPageCopy,
  formatAssignmentDate,
  type AssignmentDto,
} from '../../../lib/dashboard';
import { AssignmentStatusBadge } from './assignment-status-badge';

export function UpcomingDeadlineCard({
  assignment,
}: {
  assignment: AssignmentDto | null;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="upcoming-deadline-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="upcoming-deadline-heading" className="text-base">
          {assignmentsPageCopy.upcomingTitle}
        </CardTitle>
        {!assignment ? (
          <CardDescription>{assignmentsPageCopy.upcomingEmpty}</CardDescription>
        ) : null}
      </CardHeader>

      {assignment ? (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <AssignmentStatusBadge status={assignment.status} />
            <Badge variant="neutral">{assignmentPriorityLabel[assignment.priority]}</Badge>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{assignment.title}</p>
            <p className="mt-1 text-small text-muted-foreground">{assignment.courseTitle}</p>
          </div>
          <p className="text-small text-foreground">
            <span className="text-muted-foreground">{assignmentsPageCopy.dueLabel}: </span>
            {formatAssignmentDate(assignment.dueDate)}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}
