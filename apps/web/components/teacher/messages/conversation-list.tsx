import {
  teacherMessagesPageCopy,
  type TeacherConversationDto,
} from '../../../lib/teacher';
import { ConversationCard } from './conversation-card';

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
}: {
  conversations: TeacherConversationDto[];
  selectedConversationId?: string | null;
  onSelect?: (conversationId: string) => void;
}): React.JSX.Element {
  return (
    <ul
      className="flex flex-col gap-3"
      aria-label={teacherMessagesPageCopy.conversationListLabel}
    >
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <ConversationCard
            conversation={conversation}
            selected={conversation.id === selectedConversationId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
