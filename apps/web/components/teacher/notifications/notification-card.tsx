'use client';

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
  formatTeacherNotificationRelativeTime,
  teacherNotificationTypeLabel,
  teacherNotificationsPageCopy,
  type TeacherNotificationDto,
} from '../../../lib/teacher';
import { NotificationPriorityBadge } from '../../dashboard/notifications';

export function TeacherNotificationCard({
  notification,
  selected = false,
  marking = false,
  onSelect,
  onMarkRead,
  pageCopy,
}: {
  notification: TeacherNotificationDto;
  selected?: boolean;
  marking?: boolean;
  onSelect: (id: string) => void;
  onMarkRead?: (id: string) => void;
  pageCopy?: {
    unreadLabel?: string;
    readLabel?: string;
    markAsRead?: string;
  };
}): React.JSX.Element {
  const copy = { ...teacherNotificationsPageCopy, ...pageCopy };
  const Icon = getIcon(notification.icon);
  const unread = notification.readAt === null;

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
                {unread ? copy.unreadLabel : copy.readLabel}
              </Badge>
              <NotificationPriorityBadge priority={notification.priority} />
              <Badge variant="neutral">{teacherNotificationTypeLabel[notification.type]}</Badge>
            </div>
            <CardTitle className="text-base leading-snug">{notification.title}</CardTitle>
            <CardDescription className="line-clamp-2">{notification.message}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-caption text-muted-foreground">
          {formatTeacherNotificationRelativeTime(notification.createdAt)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full flex-col gap-2 tablet:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!unread || marking || !onMarkRead}
            onClick={() => {
              onMarkRead?.(notification.id);
            }}
          >
            {copy.markAsRead}
          </Button>
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
        </div>
      </CardFooter>
    </Card>
  );
}
