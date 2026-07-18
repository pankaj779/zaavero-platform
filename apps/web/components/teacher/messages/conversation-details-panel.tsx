'use client';

import {
  formatTeacherMessageDateTime,
  teacherConversationTypeLabel,
  teacherMessagesPageCopy,
  type TeacherConversationDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';

export type MessagesPortalMode = 'teacher' | 'student';

/** Conversation details placeholder panel — Escape closes. */
export function ConversationDetailsPanel({
  conversation,
  onClose,
  portalMode = 'teacher',
  pageCopy,
}: {
  conversation: TeacherConversationDto;
  onClose: () => void;
  portalMode?: MessagesPortalMode;
  pageCopy?: Partial<typeof teacherMessagesPageCopy>;
}): React.JSX.Element {
  const copy = { ...teacherMessagesPageCopy, ...pageCopy };
  const showParticipantManagement = portalMode === 'teacher';
  const conversationTypeLabel =
    portalMode === 'student'
      ? {
          student: 'Direct / mentor',
          batch: 'Course cohort',
          announcement: 'Support',
        }[conversation.type]
      : teacherConversationTypeLabel[conversation.type];

  const integrationRows = [
    { id: 'realtime', label: 'Realtime / websocket', value: 'Coming Soon' },
    { id: 'uploads', label: 'File uploads', value: 'Available' },
    { id: 'notifications', label: 'Notifications', value: 'Coming Soon' },
    { id: 'reactions', label: 'Reactions', value: 'Coming Soon' },
  ];

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsLabel}: ${conversation.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={conversation.title}
      eyebrow={
        <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
          {conversationTypeLabel}
        </p>
      }
      onClose={onClose}
      focusKey={conversation.id}
      contentClassName="space-y-6 p-5 pt-0"
    >
      <TeacherDetailList
        layout="stack"
        rows={[
          {
            id: 'type',
            label: copy.typeLabel,
            value: conversationTypeLabel,
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
        {showParticipantManagement ? (
          <p className="text-caption text-muted-foreground">
            Participant management will arrive with conversation administration tools.
          </p>
        ) : null}
      </section>

      {showParticipantManagement ? (
        <section className="space-y-3" aria-label={copy.futureFeaturesLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.futureFeaturesLabel}</h3>
          <TeacherDetailList layout="stack" rows={integrationRows} />
          <p className="text-caption text-muted-foreground">{copy.attachmentsPlaceholder}</p>
        </section>
      ) : null}
    </TeacherDetailsPanel>
  );
}
