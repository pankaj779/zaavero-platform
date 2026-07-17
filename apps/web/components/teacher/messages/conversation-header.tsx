import { Badge, Button } from '@graphology/ui';
import {
  teacherConversationTypeLabel,
  teacherMessagesPageCopy,
  type TeacherConversationDto,
} from '../../../lib/teacher';

export function ConversationHeader({
  conversation,
  onOpenDetails,
}: {
  conversation: TeacherConversationDto;
  onOpenDetails?: () => void;
}): React.JSX.Element {
  const copy = teacherMessagesPageCopy;

  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4 tablet:flex-row tablet:items-start tablet:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{teacherConversationTypeLabel[conversation.type]}</Badge>
          {conversation.unreadCount > 0 ? (
            <Badge variant="primary">
              {`${copy.unreadLabel}: ${String(conversation.unreadCount)}`}
            </Badge>
          ) : null}
        </div>
        <h2 className="text-base font-semibold leading-snug text-foreground">
          {conversation.title}
        </h2>
        {conversation.courseTitle ? (
          <p className="text-caption text-muted-foreground">{`Course: ${conversation.courseTitle}`}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`${copy.detailsLabel} — ${conversation.title}`}
        onClick={onOpenDetails}
      >
        {copy.detailsLabel}
      </Button>
    </header>
  );
}
