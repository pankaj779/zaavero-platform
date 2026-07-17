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
import { getIcon } from '../../../lib/constants';
import {
  formatNotificationRelativeTime,
  isNotificationUnread,
  notificationTypeLabel,
  notificationsPageCopy,
  type NotificationDto,
} from '../../../lib/dashboard';
import { NotificationPriorityBadge } from './notification-priority-badge';

export function NotificationCard({
  notification,
  selected = false,
  onSelect,
}: {
  notification: NotificationDto;
  selected?: boolean;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const Icon = getIcon(notification.icon);
  const unread = isNotificationUnread(notification);

  return (
    <Card
      className={
        selected
          ? 'flex h-full flex-col rounded-xl shadow-sm ring-2 ring-ring'
          : 'flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md'
      }
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-foreground" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={unread ? 'secondary' : 'neutral'}>
                {unread ? notificationsPageCopy.unreadLabel : notificationsPageCopy.readLabel}
              </Badge>
              <NotificationPriorityBadge priority={notification.priority} />
              <Badge variant="neutral">{notificationTypeLabel[notification.type]}</Badge>
            </div>
            <CardTitle className="text-base leading-snug">{notification.title}</CardTitle>
            <CardDescription className="line-clamp-2">{notification.message}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-caption text-muted-foreground">
          {formatNotificationRelativeTime(notification.createdAt)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full flex-col gap-2 tablet:flex-row">
          <Button type="button" variant="outline" size="sm" className="w-full" disabled>
            {notificationsPageCopy.open}
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full" disabled>
            {notificationsPageCopy.markAsRead}
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full" disabled>
            {notificationsPageCopy.archive}
          </Button>
        </div>
        <Badge variant="neutral" className="w-full justify-center">
          {notificationsPageCopy.comingSoon}
        </Badge>
        <Button
          type="button"
          variant={selected ? 'primary' : 'ghost'}
          size="sm"
          className="w-full"
          aria-pressed={selected}
          onClick={() => {
            onSelect(notification.id);
          }}
        >
          View details
        </Button>
      </CardFooter>
    </Card>
  );
}
