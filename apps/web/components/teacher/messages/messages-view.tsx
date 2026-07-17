import {
  teacherConversations,
  teacherMessagesViewState,
  type TeacherConversationDto,
  type TeacherMessagesViewState,
} from '../../../lib/teacher';
import { MessagesEmptyState } from './messages-empty-state';
import { MessagesErrorState } from './messages-error-state';
import { MessagesHeader } from './messages-header';
import { MessagesSkeleton } from './messages-skeleton';
import { MessagesWorkspace } from './messages-workspace';

/** Server-renderable messages shell; interactivity lives in MessagesWorkspace. */
export function MessagesView({
  conversations = teacherConversations,
  viewState = teacherMessagesViewState,
}: {
  conversations?: TeacherConversationDto[];
  viewState?: TeacherMessagesViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <MessagesHeader />
        <MessagesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <MessagesHeader />
        <MessagesErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || conversations.length === 0) {
    return (
      <div className="space-y-8">
        <MessagesHeader />
        <MessagesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MessagesHeader />
      <MessagesWorkspace conversations={conversations} />
    </div>
  );
}
