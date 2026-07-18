'use client';

import { MessagesView } from '../../teacher/messages';
import { studentMessagesPageCopy } from './copy';

/** Student Messages route — participant-scoped Messaging API with send/reply. */
export function StudentMessagesView(): React.JSX.Element {
  return <MessagesView portalMode="student" pageCopy={studentMessagesPageCopy} />;
}
