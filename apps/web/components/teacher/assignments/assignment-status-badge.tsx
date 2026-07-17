import { Badge } from '@graphology/ui';
import {
  teacherAssignmentStatusLabel,
  type TeacherAssignmentStatus,
} from '../../../lib/teacher';

const statusVariant: Record<
  TeacherAssignmentStatus,
  'warning' | 'success' | 'secondary' | 'neutral'
> = {
  draft: 'warning',
  published: 'success',
  closed: 'secondary',
  archived: 'neutral',
};

export function AssignmentStatusBadge({
  status,
}: {
  status: TeacherAssignmentStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{teacherAssignmentStatusLabel[status]}</Badge>;
}
