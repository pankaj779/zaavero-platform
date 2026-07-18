import { Badge, Button, Card, CardContent } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherMessageDateTime,
  teacherConversationTypeLabel,
  teacherMessagesPageCopy,
  type TeacherConversationDto,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';

export function ConversationCard({
  conversation,
  selected = false,
  onSelect,
}: {
  conversation: TeacherConversationDto;
  selected?: boolean;
  onSelect?: (conversationId: string) => void;
}): React.JSX.Element {
  const copy = teacherMessagesPageCopy;

  return (
    <Card
      className={cn(teacherCardSurfaceClass, selected ? 'ring-2 ring-primary ring-offset-2' : '')}
    >
      <CardContent className="p-4">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start whitespace-normal p-0 text-left hover:bg-transparent"
          aria-pressed={selected}
          aria-label={`Open conversation ${conversation.title}`}
          onClick={() => {
            onSelect?.(conversation.id);
          }}
        >
          <span className="flex w-full flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{teacherConversationTypeLabel[conversation.type]}</Badge>
              {conversation.unreadCount > 0 ? (
                <Badge variant="primary">
                  {`${copy.unreadLabel}: ${String(conversation.unreadCount)}`}
                </Badge>
              ) : null}
            </span>
            <span className="text-small font-semibold text-foreground">{conversation.title}</span>
            <span className="line-clamp-2 text-caption text-muted-foreground">
              {conversation.lastMessage.body}
            </span>
            <span className="text-caption text-muted-foreground">
              {formatTeacherMessageDateTime(conversation.updatedAt)}
            </span>
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
