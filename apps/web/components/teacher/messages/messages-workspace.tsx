'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherConversations,
  getTeacherConversationById,
  type TeacherConversationDto,
  type TeacherMessageFilter,
} from '../../../lib/teacher';
import { ComposePanel } from './compose-panel';
import { ConversationDetailsPanel } from './conversation-details-panel';
import { ConversationHeader } from './conversation-header';
import { MessageThread } from './message-thread';
import { MessagesEmptyState } from './messages-empty-state';
import { MessagesSidebar } from './messages-sidebar';

/** Client boundary for search, filters, selection, and compose state. */
export function MessagesWorkspace({
  conversations,
}: {
  conversations: TeacherConversationDto[];
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TeacherMessageFilter>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const visibleConversations = useMemo(
    () => filterTeacherConversations(conversations, query, filter),
    [conversations, query, filter],
  );

  const selectedConversation = useMemo(
    () =>
      selectedConversationId === null
        ? null
        : getTeacherConversationById(conversations, selectedConversationId),
    [conversations, selectedConversationId],
  );

  return (
    <div className="grid gap-4 laptop:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,16rem)]">
      <MessagesSidebar
        conversations={visibleConversations}
        query={query}
        filter={filter}
        selectedConversationId={selectedConversationId}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
        onSelect={(conversationId) => {
          setSelectedConversationId(conversationId);
          setDetailsOpen(false);
        }}
      />

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm tablet:p-5">
        {selectedConversation ? (
          <>
            <ConversationHeader
              conversation={selectedConversation}
              onOpenDetails={() => {
                setDetailsOpen(true);
              }}
            />
            <MessageThread conversation={selectedConversation} />
            <ComposePanel />
          </>
        ) : (
          <MessagesEmptyState variant="no-selection" />
        )}
      </section>

      <aside className="min-w-0" aria-label="Conversation details placeholder">
        {selectedConversation && detailsOpen ? (
          <ConversationDetailsPanel
            conversation={selectedConversation}
            onClose={() => {
              setDetailsOpen(false);
            }}
          />
        ) : (
          <div className="hidden rounded-xl border border-dashed border-border bg-muted/20 p-5 laptop:block">
            <MessagesEmptyState variant="no-selection" />
          </div>
        )}
      </aside>
    </div>
  );
}
