import { Badge } from '@graphology/ui';
import {
  notificationPriorityLabel,
  type NotificationPriority,
} from '../../../lib/dashboard';

const priorityVariant: Record<
  NotificationPriority,
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
  priority: NotificationPriority;
}): React.JSX.Element {
  return (
    <Badge variant={priorityVariant[priority]}>{notificationPriorityLabel[priority]}</Badge>
  );
}
