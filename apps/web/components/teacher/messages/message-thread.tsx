import {
  teacherMessagesPageCopy,
  type TeacherConversationDto,
} from '../../../lib/teacher';
import { MessageBubble } from './message-bubble';

export function MessageThread({
  conversation,
}: {
  conversation: TeacherConversationDto;
}): React.JSX.Element {
  return (
    <section
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
      aria-label={teacherMessagesPageCopy.threadLabel}
    >
      {conversation.messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.sender.role === 'teacher'}
        />
      ))}
    </section>
  );
}
