import { Badge } from '@graphology/ui';
import { teacherSubmissionStatusLabel, type TeacherSubmissionStatus } from '../../../lib/teacher';

const statusVariant: Record<
  TeacherSubmissionStatus,
  'warning' | 'success' | 'secondary' | 'neutral' | 'danger'
> = {
  pending: 'warning',
  submitted: 'secondary',
  late: 'danger',
  graded: 'success',
  returned: 'neutral',
};

export function SubmissionStatusBadge({
  status,
}: {
  status: TeacherSubmissionStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{teacherSubmissionStatusLabel[status]}</Badge>;
}
