import { Badge } from '@graphology/ui';
import {
  assignmentStatusLabel,
  type AssignmentStatus,
} from '../../../lib/dashboard';

const statusVariant: Record<
  AssignmentStatus,
  'neutral' | 'secondary' | 'warning' | 'danger' | 'success'
> = {
  pending: 'neutral',
  in_progress: 'secondary',
  submitted: 'success',
  overdue: 'danger',
  locked: 'warning',
};

export function AssignmentStatusBadge({
  status,
}: {
  status: AssignmentStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{assignmentStatusLabel[status]}</Badge>;
}
