import { MessageFilters } from './message-filters';
import { MessageSearch } from './message-search';
import { ConversationList } from './conversation-list';
import {
  teacherMessagesPageCopy,
  type TeacherConversationDto,
  type TeacherMessageFilter,
} from '../../../lib/teacher';
import { MessagesEmptyState } from './messages-empty-state';

export function MessagesSidebar({
  conversations,
  query,
  filter,
  selectedConversationId,
  onQueryChange,
  onFilterChange,
  onSelect,
}: {
  conversations: TeacherConversationDto[];
  query: string;
  filter: TeacherMessageFilter;
  selectedConversationId?: string | null;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: TeacherMessageFilter) => void;
  onSelect: (conversationId: string) => void;
}): React.JSX.Element {
  return (
    <aside
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-label={teacherMessagesPageCopy.conversationListLabel}
    >
      <div className="space-y-3">
        <MessageSearch value={query} onChange={onQueryChange} />
        <MessageFilters value={filter} onChange={onFilterChange} />
      </div>
      {conversations.length === 0 ? (
        <MessagesEmptyState variant="no-matches" />
      ) : (
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelect={onSelect}
        />
      )}
    </aside>
  );
}
