/** Student-facing copy for shared Teacher engagement workspaces. */

export const studentCalendarPageCopy = {
  title: 'Calendar',
  description: 'Your classes, deadlines, and learning events in one place.',
} as const;

export const studentMessagesPageCopy = {
  title: 'Messages',
  description: 'Read and reply to mentor and course conversations.',
} as const;

export const studentNotificationsPageCopy = {
  title: 'Notifications',
  description: 'Learning alerts for your courses — filter, mark read, and stay current.',
  emptyTitle: 'No notifications yet',
  emptyDescription: 'Course and account updates will appear here.',
  errorTitle: 'Unable to load notifications',
  errorDescription: 'Something went wrong while loading notifications. Please try again.',
} as const;
