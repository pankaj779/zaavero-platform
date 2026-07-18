import { Badge } from '@graphology/ui';
import {
  teacherNotificationPriorityLabel,
  type TeacherNotificationPriority,
} from '../../../lib/teacher';

const priorityVariant: Record<
  TeacherNotificationPriority,
  'neutral' | 'secondary' | 'warning' | 'danger'
> = {
  low: 'neutral',
  medium: 'secondary',
  high: 'warning',
  critical: 'danger',
};

export function NotificationPriorityBadge({
  priority,
}: {
  priority: TeacherNotificationPriority;
}): React.JSX.Element {
  return (
    <Badge variant={priorityVariant[priority]}>{teacherNotificationPriorityLabel[priority]}</Badge>
  );
}
