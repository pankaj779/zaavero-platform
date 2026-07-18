'use client';

import { NotificationsView } from '../../teacher/notifications';
import { studentNotificationsPageCopy } from './copy';

/** Student Notifications route — live Notification API with mark-read actions. */
export function StudentNotificationsView(): React.JSX.Element {
  return <NotificationsView portalMode="student" pageCopy={studentNotificationsPageCopy} />;
}
