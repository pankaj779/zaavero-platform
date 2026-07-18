'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessagingApi } from '../../../lib/api';
import { useAuth, useOrganization } from '../../../lib/auth';
import {
  filterTeacherConversations,
  toConversationApiType,
  toConversationListSort,
  type TeacherConversationDto,
  type TeacherMessageFilter,
  type TeacherMessagesViewState,
} from '../../../lib/teacher';
import { type MessagesPortalMode } from './conversation-details-panel';
import { MessagesEmptyState } from './messages-empty-state';
import { MessagesErrorState } from './messages-error-state';
import { MessagesHeader } from './messages-header';
import { MessagesSkeleton } from './messages-skeleton';
import { MessagesWorkspace } from './messages-workspace';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function MessagesView({
  initialConversations,
  initialViewState,
  portalMode = 'teacher',
  pageCopy,
}: {
  /** Optional test override; supplying both values skips network loading. */
  initialConversations?: TeacherConversationDto[];
  initialViewState?: TeacherMessagesViewState;
  portalMode?: MessagesPortalMode;
  pageCopy?: {
    title?: string;
    description?: string;
  };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<TeacherMessageFilter>('all');
  const [conversations, setConversations] = useState<TeacherConversationDto[]>(
    initialConversations ?? [],
  );
  const [viewState, setViewState] = useState<TeacherMessagesViewState>(
    initialViewState ?? 'loading',
  );
  const hasLoadedRef = useRef(initialViewState !== undefined);

  const sendMessage = useCallback(
    async (conversationId: string, body: string, attachments: string[]) => {
      if (user === null) {
        throw new Error('Authentication is required.');
      }
      const currentUser = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
      };
      const message = await MessagingApi.sendMessage(
        conversationId,
        { body, attachments },
        currentUser,
      );
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: message,
                messages: [...conversation.messages, message],
                updatedAt: message.timestamp,
              }
            : conversation,
        ),
      );
    },
    [user],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (initialConversations !== undefined && initialViewState !== undefined) {
      return;
    }

    const controller = new AbortController();
    if (!hasLoadedRef.current) {
      setViewState('loading');
    }

    void (async () => {
      try {
        const { sortBy, sortOrder } = toConversationListSort();
        const result = await MessagingApi.getConversations({
          organizationId: primaryOrganizationId ?? undefined,
          type: toConversationApiType(filter),
          search: debouncedQuery.trim() || undefined,
          page: 1,
          limit: LIST_LIMIT,
          sortBy,
          sortOrder,
          currentUser: user
            ? {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`.trim(),
              }
            : undefined,
        });

        if (controller.signal.aborted) {
          return;
        }

        // Backend search covers titles only. Complete participant/message search
        // and unread filtering after thread hydration.
        const filtered = filterTeacherConversations(result.items, debouncedQuery, filter);
        setConversations(filtered);
        const filtersActive = debouncedQuery.trim().length > 0 || filter !== 'all';
        setViewState(result.meta.total === 0 && !filtersActive ? 'empty' : 'populated');
        hasLoadedRef.current = true;
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, filter, initialConversations, initialViewState, primaryOrganizationId, user]);

  const header = <MessagesHeader pageCopy={pageCopy} />;

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        {header}
        <MessagesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        {header}
        <MessagesErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || conversations.length === 0) {
    return (
      <div className="space-y-8">
        {header}
        <MessagesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}
      <MessagesWorkspace
        conversations={conversations}
        organizationId={primaryOrganizationId ?? ''}
        query={query}
        filter={filter}
        portalMode={portalMode}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
        onSendMessage={sendMessage}
        serverFiltered
      />
    </div>
  );
}
