'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  formatTeacherMessageDateTime,
  teacherConversationTypeLabel,
  teacherMessagesPageCopy,
  type TeacherConversationDto,
} from '../../../lib/teacher';

const CloseIcon = icons.close;

function DetailList({
  rows,
}: {
  rows: { id: string; label: string; value: React.ReactNode }[];
}): React.JSX.Element {
  return (
    <dl className="grid gap-2 text-small">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Conversation details placeholder panel — Escape closes. */
export function ConversationDetailsPanel({
  conversation,
  onClose,
}: {
  conversation: TeacherConversationDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherMessagesPageCopy;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [conversation.id]);

  const integrationRows = [
    { id: 'realtime', label: 'Realtime / websocket', value: 'Coming Soon' },
    { id: 'uploads', label: 'File uploads', value: 'Coming Soon' },
    { id: 'notifications', label: 'Notifications', value: 'Coming Soon' },
    { id: 'reactions', label: 'Reactions', value: 'Coming Soon' },
  ];

  return (
    <Card
      role="region"
      aria-label={`${copy.detailsLabel}: ${conversation.title}`}
      className="rounded-xl shadow-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {teacherConversationTypeLabel[conversation.type]}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {conversation.title}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={copy.detailsCloseLabel}
          onClick={onClose}
        >
          <CloseIcon className="h-4 w-4" aria-hidden />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 p-5 pt-0">
        <DetailList
          rows={[
            {
              id: 'type',
              label: copy.typeLabel,
              value: teacherConversationTypeLabel[conversation.type],
            },
            {
              id: 'updated',
              label: copy.lastUpdatedLabel,
              value: formatTeacherMessageDateTime(conversation.updatedAt),
            },
            {
              id: 'unread',
              label: copy.unreadLabel,
              value: String(conversation.unreadCount),
            },
            {
              id: 'course',
              label: 'Course',
              value: conversation.courseTitle ?? '—',
            },
          ]}
        />

        <section className="space-y-3" aria-label={copy.participantsLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.participantsLabel}</h3>
          <ul className="flex flex-col gap-2">
            {conversation.participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-xs font-semibold text-muted-foreground"
                  >
                    {participant.initials}
                  </span>
                  <span className="truncate text-small font-medium text-foreground">
                    {participant.name}
                  </span>
                </span>
                <span className="shrink-0 text-caption capitalize text-muted-foreground">
                  {participant.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3" aria-label={copy.futureFeaturesLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.futureFeaturesLabel}</h3>
          <DetailList rows={integrationRows} />
          <p className="text-caption text-muted-foreground">{copy.attachmentsPlaceholder}</p>
        </section>
      </CardContent>
    </Card>
  );
}
