import { Badge } from '@graphology/ui';
import {
  teacherStudentStatusLabel,
  type TeacherStudentEnrollmentStatus,
} from '../../../lib/teacher';

const statusVariant: Record<
  TeacherStudentEnrollmentStatus,
  'success' | 'neutral' | 'secondary'
> = {
  active: 'success',
  inactive: 'neutral',
  completed: 'secondary',
};

export function StudentStatusBadge({
  status,
}: {
  status: TeacherStudentEnrollmentStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{teacherStudentStatusLabel[status]}</Badge>;
}
