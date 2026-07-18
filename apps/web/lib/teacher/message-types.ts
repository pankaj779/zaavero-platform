import { formatDashboardDateTime } from '../dashboard/format-date';

export type TeacherConversationType = 'student' | 'batch' | 'announcement';
export type TeacherMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type TeacherMessagesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherMessageFilter = 'all' | 'unread' | 'students' | 'batches' | 'announcements';
export type TeacherMessageIntegrationAvailability = 'coming_soon';

export interface TeacherParticipantDto {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'system';
  initials: string;
}

/** Non-downloadable display metadata derived from backend attachment references. */
export interface TeacherAttachmentDto {
  id: string;
  label: string;
  kind: string;
}

export interface TeacherMessageDto {
  id: string;
  sender: TeacherParticipantDto;
  timestamp: string;
  body: string;
  attachments: TeacherAttachmentDto[];
  status: TeacherMessageStatus;
}

export interface TeacherConversationFutureFeaturesDto {
  realtime: TeacherMessageIntegrationAvailability;
  uploads: TeacherMessageIntegrationAvailability;
  notifications: TeacherMessageIntegrationAvailability;
  reactions: TeacherMessageIntegrationAvailability;
}

export interface TeacherConversationDto {
  id: string;
  title: string;
  type: TeacherConversationType;
  unreadCount: number;
  lastMessage: TeacherMessageDto;
  updatedAt: string;
  participants: TeacherParticipantDto[];
  messages: TeacherMessageDto[];
  courseTitle: string | null;
  futureFeatures: TeacherConversationFutureFeaturesDto;
}

export const teacherMessageComingSoonFeatures: TeacherConversationFutureFeaturesDto = {
  realtime: 'coming_soon',
  uploads: 'coming_soon',
  notifications: 'coming_soon',
  reactions: 'coming_soon',
};

export const teacherMessagesPageCopy = {
  title: 'Messages',
  description: 'Bounded mentor–student and cohort conversations.',
  searchPlaceholder: 'Search conversations',
  searchLabel: 'Search conversations',
  filterLabel: 'Filter conversations',
  conversationListLabel: 'Conversations',
  threadLabel: 'Conversation thread',
  detailsLabel: 'Conversation details',
  detailsCloseLabel: 'Close conversation details',
  composeLabel: 'Compose message',
  composePlaceholder: 'Write a message…',
  sendButton: 'Send',
  attachButton: 'Attach file',
  emojiButton: 'Add emoji',
  comingSoonNote: 'Sending from this workspace is coming soon.',
  emptyTitle: 'No conversations yet',
  emptyDescription: 'Student and batch threads will appear here when they are created.',
  noMatchesTitle: 'No matching conversations',
  noMatchesDescription: 'Try a different search or filter.',
  noSelectionTitle: 'Select a conversation',
  noSelectionDescription: 'Choose a thread from the list to preview messages.',
  errorTitle: 'Unable to load messages',
  errorDescription: 'Something went wrong while loading Messages. Please try again.',
  unreadLabel: 'Unread',
  participantsLabel: 'Participants',
  typeLabel: 'Type',
  lastUpdatedLabel: 'Last updated',
  futureFeaturesLabel: 'Future integrations',
  attachmentsPlaceholder: 'Attachment downloads are not enabled in this workspace.',
} as const;

export const teacherConversationTypeLabel: Record<TeacherConversationType, string> = {
  student: 'Student',
  batch: 'Batch',
  announcement: 'Announcement',
};

export const teacherMessageStatusLabel: Record<TeacherMessageStatus, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
};

export const teacherMessageFilterOptions: {
  value: TeacherMessageFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'students', label: 'Students' },
  { value: 'batches', label: 'Batches' },
  { value: 'announcements', label: 'Announcements' },
];

export function filterTeacherConversations(
  conversations: TeacherConversationDto[],
  query: string,
  filter: TeacherMessageFilter,
): TeacherConversationDto[] {
  const normalized = query.trim().toLowerCase();

  return conversations.filter((conversation) => {
    if (filter === 'unread' && conversation.unreadCount === 0) {
      return false;
    }
    if (filter === 'students' && conversation.type !== 'student') {
      return false;
    }
    if (filter === 'batches' && conversation.type !== 'batch') {
      return false;
    }
    if (filter === 'announcements' && conversation.type !== 'announcement') {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      conversation.title.toLowerCase().includes(normalized) ||
      conversation.lastMessage.body.toLowerCase().includes(normalized) ||
      (conversation.courseTitle?.toLowerCase().includes(normalized) ?? false) ||
      conversation.participants.some((participant) =>
        participant.name.toLowerCase().includes(normalized),
      )
    );
  });
}

export function getTeacherConversationById(
  conversations: TeacherConversationDto[],
  id: string,
): TeacherConversationDto | null {
  return conversations.find((conversation) => conversation.id === id) ?? null;
}

export function formatTeacherMessageDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}

export function toConversationApiType(
  filter: TeacherMessageFilter,
): 'DIRECT' | 'BATCH' | 'SUPPORT' | undefined {
  switch (filter) {
    case 'students':
      return 'DIRECT';
    case 'batches':
      return 'BATCH';
    case 'announcements':
      return 'SUPPORT';
    default:
      return undefined;
  }
}

export function toConversationListSort(): {
  sortBy: 'updatedAt';
  sortOrder: 'desc';
} {
  return { sortBy: 'updatedAt', sortOrder: 'desc' };
}
