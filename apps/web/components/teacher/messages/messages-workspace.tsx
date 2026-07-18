'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  filterTeacherConversations,
  getTeacherConversationById,
  type TeacherConversationDto,
  type TeacherMessageFilter,
} from '../../../lib/teacher';
import { ComposePanel } from './compose-panel';
import { ConversationDetailsPanel, type MessagesPortalMode } from './conversation-details-panel';
import { ConversationHeader } from './conversation-header';
import { MessageThread } from './message-thread';
import { MessagesEmptyState } from './messages-empty-state';
import { MessagesSidebar } from './messages-sidebar';

/** Client boundary for search, filters, selection, and compose state. */
export function MessagesWorkspace({
  conversations,
  query: controlledQuery,
  filter: controlledFilter,
  onQueryChange,
  onFilterChange,
  onSendMessage,
  organizationId,
  serverFiltered = false,
  portalMode = 'teacher',
}: {
  conversations: TeacherConversationDto[];
  query?: string;
  filter?: TeacherMessageFilter;
  onQueryChange?: (value: string) => void;
  onFilterChange?: (value: TeacherMessageFilter) => void;
  onSendMessage?: (conversationId: string, body: string, attachments: string[]) => Promise<void>;
  organizationId: string;
  /** Parent already applied backend and client completion filters. */
  serverFiltered?: boolean;
  portalMode?: MessagesPortalMode;
}): React.JSX.Element {
  const [localQuery, setLocalQuery] = useState('');
  const [localFilter, setLocalFilter] = useState<TeacherMessageFilter>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const query = controlledQuery ?? localQuery;
  const filter = controlledFilter ?? localFilter;

  const visibleConversations = useMemo(() => {
    if (serverFiltered) {
      return conversations;
    }
    return filterTeacherConversations(conversations, query, filter);
  }, [conversations, filter, query, serverFiltered]);

  useEffect(() => {
    if (visibleConversations.length === 0) {
      setSelectedConversationId(null);
      setDetailsOpen(false);
      return;
    }
    if (
      selectedConversationId === null ||
      !visibleConversations.some((conversation) => conversation.id === selectedConversationId)
    ) {
      setSelectedConversationId(visibleConversations[0]?.id ?? null);
      setDetailsOpen(false);
    }
  }, [selectedConversationId, visibleConversations]);

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
        onQueryChange={onQueryChange ?? setLocalQuery}
        onFilterChange={onFilterChange ?? setLocalFilter}
        portalMode={portalMode}
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
            <ComposePanel
              organizationId={organizationId}
              conversationId={selectedConversation.id}
              onSend={(body, attachments) => {
                if (!onSendMessage) {
                  return Promise.reject(new Error('Messaging is unavailable.'));
                }
                return onSendMessage(selectedConversation.id, body, attachments);
              }}
            />
          </>
        ) : (
          <MessagesEmptyState variant="no-selection" />
        )}
      </section>

      <aside className="min-w-0" aria-label="Conversation details placeholder">
        {selectedConversation && detailsOpen ? (
          <ConversationDetailsPanel
            conversation={selectedConversation}
            portalMode={portalMode}
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
