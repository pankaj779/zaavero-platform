import { Badge } from '@graphology/ui';
import {
  teacherCourseStatusLabel,
  type TeacherCourseStatus,
} from '../../../lib/teacher';

const statusVariant: Record<TeacherCourseStatus, 'success' | 'secondary' | 'neutral'> = {
  published: 'success',
  draft: 'secondary',
  archived: 'neutral',
};

export function CourseStatusBadge({
  status,
}: {
  status: TeacherCourseStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{teacherCourseStatusLabel[status]}</Badge>;
}
