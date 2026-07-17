import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import {
  formatNotificationDate,
  isNotificationUnread,
  notificationTypeLabel,
  notificationsPageCopy,
  type NotificationDto,
} from '../../../lib/dashboard';
import { NotificationPriorityBadge } from './notification-priority-badge';

export function NotificationDetails({
  notification,
}: {
  notification: NotificationDto | null;
}): React.JSX.Element {
  if (!notification) {
    return (
      <Card className="rounded-xl shadow-sm" aria-labelledby="notification-details-heading">
        <CardHeader>
          <CardTitle id="notification-details-heading" className="text-base">
            {notificationsPageCopy.detailsTitle}
          </CardTitle>
          <CardDescription>{notificationsPageCopy.detailsEmpty}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unread = isNotificationUnread(notification);

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="notification-details-heading">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={unread ? 'secondary' : 'neutral'}>
            {unread ? notificationsPageCopy.unreadLabel : notificationsPageCopy.readLabel}
          </Badge>
          <NotificationPriorityBadge priority={notification.priority} />
          <Badge variant="neutral">{notificationTypeLabel[notification.type]}</Badge>
        </div>
        <CardTitle id="notification-details-heading" className="text-lg">
          {notification.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 text-small">
        <p className="leading-relaxed text-foreground">{notification.message}</p>

        <dl className="grid gap-3">
          <div>
            <dt className="text-caption text-muted-foreground">
              {notificationsPageCopy.createdLabel}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatNotificationDate(notification.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">
              {notificationsPageCopy.relatedLabel}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {notification.relatedFeatureLabel}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{notificationsPageCopy.typeLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {notificationTypeLabel[notification.type]}
            </dd>
          </div>
        </dl>

        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-3">
          <p className="text-caption font-medium text-muted-foreground">
            {notification.actionLabel ?? 'Action'}
          </p>
          <p className="mt-1 text-small text-muted-foreground">
            {notificationsPageCopy.actionPlaceholder}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
