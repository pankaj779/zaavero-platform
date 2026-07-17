import type { IconName } from '../constants/icons';

/**
 * Honest placeholder data for the Teacher Portal dashboard.
 * No real metrics are invented — values remain neutral until backend integration.
 * DTO shapes are intentionally future-ready so wiring APIs later is a mechanical swap.
 */

export type TeacherViewState = 'loading' | 'empty' | 'error' | 'populated';

export interface TeacherProfilePlaceholderDto {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  initials: string;
}

/** Identity shown in the topbar profile menu and dashboard greeting. */
export const teacherProfilePlaceholder: TeacherProfilePlaceholderDto = {
  id: 'teacher_placeholder',
  name: 'Teacher Placeholder',
  email: 'teacher@example.com',
  roleLabel: 'Teacher',
  initials: 'TP',
};

export interface TeacherGreetingDto {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const teacherGreetingPlaceholder: TeacherGreetingDto = {
  eyebrow: 'Teacher Portal',
  title: 'Welcome back',
  subtitle: 'This is a preview of your teaching workspace. Modules activate as they ship.',
};

export interface TeacherStatDto {
  id: string;
  label: string;
  /** Honest placeholder — no fabricated counts before backend data exists. */
  value: string;
  helper: string;
  icon: IconName;
}

export const teacherStatsPlaceholder: TeacherStatDto[] = [
  {
    id: 'active-courses',
    label: 'Active Courses',
    value: '—',
    helper: 'Course counts appear after backend integration.',
    icon: 'book',
  },
  {
    id: 'total-students',
    label: 'Total Students',
    value: '—',
    helper: 'Enrolled learners appear once rosters connect.',
    icon: 'users',
  },
  {
    id: 'pending-reviews',
    label: 'Pending Reviews',
    value: '—',
    helper: 'Submission grading queue is coming soon.',
    icon: 'clipboard',
  },
  {
    id: 'upcoming-classes',
    label: 'Upcoming Classes',
    value: '—',
    helper: 'Scheduled live sessions will be summarized here.',
    icon: 'video',
  },
];

export interface TeacherPlaceholderItemDto {
  id: string;
  title: string;
  detail: string;
}

export interface TeacherSectionPlaceholderDto {
  id: string;
  title: string;
  description: string;
  emptyLabel: string;
  items: TeacherPlaceholderItemDto[];
}

export const teacherTodaysClassesPlaceholder: TeacherSectionPlaceholderDto = {
  id: 'todays-classes',
  title: "Today's Classes",
  description: 'Live sessions scheduled for today.',
  emptyLabel: 'No classes to show yet',
  items: [
    { id: 'class-1', title: 'Session placeholder', detail: "Today's live sessions will appear here." },
    { id: 'class-2', title: 'Session placeholder', detail: 'Join links activate once scheduling ships.' },
  ],
};

export const teacherRecentActivityPlaceholder: TeacherSectionPlaceholderDto = {
  id: 'recent-activity',
  title: 'Recent Activity',
  description: 'A short trail of recent teaching events.',
  emptyLabel: 'No recent activity yet',
  items: [
    { id: 'activity-1', title: 'Activity placeholder', detail: 'Submissions and updates will be listed here.' },
    { id: 'activity-2', title: 'Activity placeholder', detail: 'Enrollment changes will appear here.' },
  ],
};

export const teacherUpcomingWorkPlaceholder: TeacherSectionPlaceholderDto = {
  id: 'upcoming-work',
  title: 'Upcoming Work',
  description: 'Deadlines and tasks that need your attention.',
  emptyLabel: 'No upcoming work yet',
  items: [
    { id: 'work-1', title: 'Task placeholder', detail: 'Grading deadlines will appear here.' },
    { id: 'work-2', title: 'Task placeholder', detail: 'Attendance and certificate tasks will appear here.' },
  ],
};

export const teacherDashboardSections: TeacherSectionPlaceholderDto[] = [
  teacherTodaysClassesPlaceholder,
  teacherRecentActivityPlaceholder,
  teacherUpcomingWorkPlaceholder,
];

export interface TeacherNotificationPlaceholderDto {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
}

export const teacherNotificationPlaceholders: TeacherNotificationPlaceholderDto[] = [
  { id: 'tn1', title: 'Submission received', body: 'Notification details will appear here.', timeLabel: 'Placeholder' },
  { id: 'tn2', title: 'Live class reminder', body: 'Notification details will appear here.', timeLabel: 'Placeholder' },
  { id: 'tn3', title: 'New enrollment', body: 'Notification details will appear here.', timeLabel: 'Placeholder' },
];

/** Dashboard defaults to the populated (placeholder) view state. */
export const teacherDashboardViewState: TeacherViewState = 'populated';
