import { formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Messages DTOs — shaped like future GET /message-threads responses.
 * Bounded mentor–student / cohort messaging only (not a social network).
 * No websocket, uploads, or notification fan-out in this sprint. Graphology
 * appears only as one sample course context on a batch thread.
 */

export type TeacherConversationType = 'student' | 'batch' | 'announcement';
export type TeacherMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type TeacherMessagesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherMessageFilter = 'all' | 'unread' | 'students' | 'batches' | 'announcements';
export type TeacherIntegrationAvailability = 'coming_soon';

export interface TeacherParticipantDto {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'system';
  initials: string;
}

/** Placeholder attachment metadata — never a real file or download URL. */
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
  realtime: TeacherIntegrationAvailability;
  uploads: TeacherIntegrationAvailability;
  notifications: TeacherIntegrationAvailability;
  reactions: TeacherIntegrationAvailability;
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
  /** Optional course context for batch threads — Graphology is one sample only. */
  courseTitle: string | null;
  futureFeatures: TeacherConversationFutureFeaturesDto;
}

export const teacherMessagesViewState: TeacherMessagesViewState = 'populated';

export const teacherMessagesPageCopy = {
  title: 'Messages',
  description: 'Bounded mentor–student and cohort conversations. Messaging backend is coming soon.',
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
  comingSoonNote: 'Messaging backend coming soon.',
  emptyTitle: 'No conversations yet',
  emptyDescription:
    'Student and batch threads will appear here once messaging is connected.',
  noMatchesTitle: 'No matching conversations',
  noMatchesDescription: 'Try a different search or filter.',
  noSelectionTitle: 'Select a conversation',
  noSelectionDescription: 'Choose a thread from the list to preview placeholder messages.',
  errorTitle: 'Unable to load messages',
  errorDescription: 'Something went wrong while loading Messages. Please try again.',
  unreadLabel: 'Unread',
  participantsLabel: 'Participants',
  typeLabel: 'Type',
  lastUpdatedLabel: 'Last updated',
  futureFeaturesLabel: 'Future integrations',
  attachmentsPlaceholder: 'Attachments are placeholders until uploads are integrated.',
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

const comingSoonFeatures: TeacherConversationFutureFeaturesDto = {
  realtime: 'coming_soon',
  uploads: 'coming_soon',
  notifications: 'coming_soon',
  reactions: 'coming_soon',
};

const teacherSelf: TeacherParticipantDto = {
  id: 'teacher_placeholder',
  name: 'Teacher Placeholder',
  role: 'teacher',
  initials: 'TP',
};

const studentOne: TeacherParticipantDto = {
  id: 'tstudent_001',
  name: 'Student Placeholder One',
  role: 'student',
  initials: 'S1',
};

const studentTwo: TeacherParticipantDto = {
  id: 'tstudent_002',
  name: 'Student Placeholder Two',
  role: 'student',
  initials: 'S2',
};

const systemBot: TeacherParticipantDto = {
  id: 'system_placeholder',
  name: 'System',
  role: 'system',
  initials: 'SY',
};

/**
 * Honest placeholder threads. Graphology appears once as batch course context.
 * Bodies never claim a live messaging backend exists.
 */
export const teacherConversations: TeacherConversationDto[] = [
  {
    id: 'tconv_001',
    title: 'Student Placeholder One',
    type: 'student',
    unreadCount: 2,
    updatedAt: '2026-07-17T10:15:00.000Z',
    participants: [teacherSelf, studentOne],
    courseTitle: null,
    futureFeatures: comingSoonFeatures,
    messages: [
      {
        id: 'tmsg_001',
        sender: studentOne,
        timestamp: '2026-07-17T09:50:00.000Z',
        body: 'Placeholder student message — delivery and read receipts are not live yet.',
        attachments: [],
        status: 'delivered',
      },
      {
        id: 'tmsg_002',
        sender: teacherSelf,
        timestamp: '2026-07-17T10:00:00.000Z',
        body: 'Placeholder teacher reply. Sending is disabled until the messaging API lands.',
        attachments: [],
        status: 'sent',
      },
      {
        id: 'tmsg_003',
        sender: studentOne,
        timestamp: '2026-07-17T10:15:00.000Z',
        body: 'Another placeholder note about an assignment question.',
        attachments: [
          {
            id: 'tattach_001',
            label: 'Submission note placeholder',
            kind: 'document',
          },
        ],
        status: 'delivered',
      },
    ],
    lastMessage: {
      id: 'tmsg_003',
      sender: studentOne,
      timestamp: '2026-07-17T10:15:00.000Z',
      body: 'Another placeholder note about an assignment question.',
      attachments: [
        {
          id: 'tattach_001',
          label: 'Submission note placeholder',
          kind: 'document',
        },
      ],
      status: 'delivered',
    },
  },
  {
    id: 'tconv_002',
    title: 'Graphology Foundations — Weekend Cohort',
    type: 'batch',
    unreadCount: 0,
    updatedAt: '2026-07-16T16:40:00.000Z',
    participants: [teacherSelf, studentOne, studentTwo],
    courseTitle: 'Graphology Foundations',
    futureFeatures: comingSoonFeatures,
    messages: [
      {
        id: 'tmsg_004',
        sender: teacherSelf,
        timestamp: '2026-07-16T16:40:00.000Z',
        body: 'Placeholder batch reminder for this weekend’s live session.',
        attachments: [],
        status: 'read',
      },
    ],
    lastMessage: {
      id: 'tmsg_004',
      sender: teacherSelf,
      timestamp: '2026-07-16T16:40:00.000Z',
      body: 'Placeholder batch reminder for this weekend’s live session.',
      attachments: [],
      status: 'read',
    },
  },
  {
    id: 'tconv_003',
    title: 'Advanced Program — Evening Cohort',
    type: 'batch',
    unreadCount: 1,
    updatedAt: '2026-07-15T18:20:00.000Z',
    participants: [teacherSelf, studentTwo],
    courseTitle: 'Sample Advanced Program',
    futureFeatures: comingSoonFeatures,
    messages: [
      {
        id: 'tmsg_005',
        sender: studentTwo,
        timestamp: '2026-07-15T18:20:00.000Z',
        body: 'Placeholder cohort question about the case study due date.',
        attachments: [],
        status: 'delivered',
      },
    ],
    lastMessage: {
      id: 'tmsg_005',
      sender: studentTwo,
      timestamp: '2026-07-15T18:20:00.000Z',
      body: 'Placeholder cohort question about the case study due date.',
      attachments: [],
      status: 'delivered',
    },
  },
  {
    id: 'tconv_004',
    title: 'Course update broadcast',
    type: 'announcement',
    unreadCount: 0,
    updatedAt: '2026-07-14T12:00:00.000Z',
    participants: [teacherSelf, systemBot],
    courseTitle: 'Sample Skills Workshop',
    futureFeatures: comingSoonFeatures,
    messages: [
      {
        id: 'tmsg_006',
        sender: systemBot,
        timestamp: '2026-07-14T12:00:00.000Z',
        body: 'Placeholder announcement mirror. Broadcast composer lives under Announcements.',
        attachments: [],
        status: 'read',
      },
    ],
    lastMessage: {
      id: 'tmsg_006',
      sender: systemBot,
      timestamp: '2026-07-14T12:00:00.000Z',
      body: 'Placeholder announcement mirror. Broadcast composer lives under Announcements.',
      attachments: [],
      status: 'read',
    },
  },
  {
    id: 'tconv_005',
    title: 'Student Placeholder Two',
    type: 'student',
    unreadCount: 0,
    updatedAt: '2026-07-12T09:30:00.000Z',
    participants: [teacherSelf, studentTwo],
    courseTitle: null,
    futureFeatures: comingSoonFeatures,
    messages: [
      {
        id: 'tmsg_007',
        sender: teacherSelf,
        timestamp: '2026-07-12T09:30:00.000Z',
        body: 'Placeholder check-in. Real-time delivery is not enabled yet.',
        attachments: [],
        status: 'read',
      },
    ],
    lastMessage: {
      id: 'tmsg_007',
      sender: teacherSelf,
      timestamp: '2026-07-12T09:30:00.000Z',
      body: 'Placeholder check-in. Real-time delivery is not enabled yet.',
      attachments: [],
      status: 'read',
    },
  },
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
