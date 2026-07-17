import { cn } from '@graphology/utils';
import {
  formatTeacherMessageDateTime,
  teacherMessageStatusLabel,
  teacherMessagesPageCopy,
  type TeacherMessageDto,
} from '../../../lib/teacher';

export function MessageBubble({
  message,
  isOwn = false,
}: {
  message: TeacherMessageDto;
  isOwn?: boolean;
}): React.JSX.Element {
  const copy = teacherMessagesPageCopy;

  return (
    <article
      className={cn(
        'max-w-[min(100%,28rem)] rounded-xl border border-border px-4 py-3 shadow-sm',
        isOwn ? 'ml-auto bg-primary/5' : 'mr-auto bg-surface',
      )}
      aria-label={`Message from ${message.sender.name}`}
    >
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-xs font-semibold text-muted-foreground"
        >
          {message.sender.initials}
        </span>
        <span className="text-small font-medium text-foreground">{message.sender.name}</span>
        <span className="text-caption text-muted-foreground">
          {formatTeacherMessageDateTime(message.timestamp)}
        </span>
      </header>
      <p className="text-small text-foreground">{message.body}</p>
      {message.attachments.length > 0 ? (
        <ul className="mt-2 space-y-1" aria-label={copy.attachmentsPlaceholder}>
          {message.attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="rounded-md border border-dashed border-border bg-muted/20 px-2 py-1 text-caption text-muted-foreground"
            >
              {`${attachment.label} (${attachment.kind})`}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-caption text-muted-foreground">
        {teacherMessageStatusLabel[message.status]}
      </p>
    </article>
  );
}
