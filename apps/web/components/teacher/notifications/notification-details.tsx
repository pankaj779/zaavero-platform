'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import {
  formatTeacherNotificationDate,
  teacherNotificationTypeLabel,
  teacherNotificationsPageCopy,
  type TeacherNotificationDto,
} from '../../../lib/teacher';
import { NotificationPriorityBadge } from '../../dashboard/notifications';

export function TeacherNotificationDetails({
  notification,
  marking = false,
  onMarkRead,
  pageCopy,
}: {
  notification: TeacherNotificationDto | null;
  marking?: boolean;
  onMarkRead?: (id: string) => void;
  pageCopy?: {
    detailsTitle?: string;
    detailsEmpty?: string;
    unreadLabel?: string;
    readLabel?: string;
    createdLabel?: string;
    relatedLabel?: string;
    typeLabel?: string;
    markAsRead?: string;
  };
}): React.JSX.Element {
  const copy = { ...teacherNotificationsPageCopy, ...pageCopy };

  if (!notification) {
    return (
      <Card className="rounded-xl shadow-sm" aria-labelledby="notification-details-heading">
        <CardHeader>
          <CardTitle id="notification-details-heading" className="text-base">
            {copy.detailsTitle}
          </CardTitle>
          <CardDescription>{copy.detailsEmpty}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unread = notification.readAt === null;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="notification-details-heading">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={unread ? 'secondary' : 'neutral'}>
            {unread ? copy.unreadLabel : copy.readLabel}
          </Badge>
          <NotificationPriorityBadge priority={notification.priority} />
          <Badge variant="neutral">{teacherNotificationTypeLabel[notification.type]}</Badge>
        </div>
        <CardTitle id="notification-details-heading" className="text-lg">
          {notification.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 text-small">
        <p className="leading-relaxed text-foreground">{notification.message}</p>

        <dl className="grid gap-3">
          <div>
            <dt className="text-caption text-muted-foreground">{copy.createdLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatTeacherNotificationDate(notification.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{copy.relatedLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{notification.relatedFeatureLabel}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{copy.typeLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {teacherNotificationTypeLabel[notification.type]}
            </dd>
          </div>
        </dl>

        {unread && onMarkRead ? (
          <Button
            type="button"
            size="sm"
            disabled={marking}
            onClick={() => {
              onMarkRead(notification.id);
            }}
          >
            {copy.markAsRead}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
