import { Badge } from '@graphology/ui';
import { teacherBatchStatusLabel, type TeacherBatchStatus } from '../../../lib/teacher';

const statusVariant: Record<TeacherBatchStatus, 'success' | 'warning' | 'secondary' | 'neutral'> = {
  active: 'success',
  upcoming: 'warning',
  completed: 'secondary',
  archived: 'neutral',
};

export function BatchStatusBadge({
  status,
}: {
  status: TeacherBatchStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{teacherBatchStatusLabel[status]}</Badge>;
}
