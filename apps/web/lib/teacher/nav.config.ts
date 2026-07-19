import type { IconName } from '../constants/icons';
import { TEACHER_ROUTES } from '../constants/routes';

export interface TeacherNavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

/**
 * Teacher Portal sidebar navigation.
 * Order and labels are course-agnostic and future-ready for every Zaavero program.
 */
export const teacherNavItems: TeacherNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: TEACHER_ROUTES.dashboard, icon: 'dashboard' },
  { id: 'courses', label: 'Courses', href: TEACHER_ROUTES.courses, icon: 'book' },
  { id: 'lessons', label: 'Lessons', href: TEACHER_ROUTES.lessons, icon: 'fileText' },
  { id: 'live-classes', label: 'Live Classes', href: TEACHER_ROUTES.liveClasses, icon: 'video' },
  { id: 'assignments', label: 'Assignments', href: TEACHER_ROUTES.assignments, icon: 'clipboard' },
  { id: 'students', label: 'Students', href: TEACHER_ROUTES.students, icon: 'users' },
  { id: 'attendance', label: 'Attendance', href: TEACHER_ROUTES.attendance, icon: 'check' },
  { id: 'certificates', label: 'Certificates', href: TEACHER_ROUTES.certificates, icon: 'award' },
  { id: 'announcements', label: 'Announcements', href: TEACHER_ROUTES.announcements, icon: 'bell' },
  { id: 'ai', label: 'AI Studio', href: TEACHER_ROUTES.ai, icon: 'lightbulb' },
  { id: 'messages', label: 'Messages', href: TEACHER_ROUTES.messages, icon: 'message' },
  { id: 'analytics', label: 'Analytics', href: TEACHER_ROUTES.analytics, icon: 'trending' },
  { id: 'profile', label: 'Profile', href: TEACHER_ROUTES.profile, icon: 'user' },
  { id: 'settings', label: 'Settings', href: TEACHER_ROUTES.settings, icon: 'settings' },
];

export interface TeacherPageMeta {
  title: string;
  description: string;
  breadcrumb: string;
}

export const teacherPageMeta: Record<string, TeacherPageMeta> = {
  [TEACHER_ROUTES.dashboard]: {
    title: 'Dashboard',
    description:
      'Your teaching command center — a calm overview of today and what needs attention.',
    breadcrumb: 'Dashboard',
  },
  [TEACHER_ROUTES.courses]: {
    title: 'Courses',
    description: 'Review and manage the programs you teach.',
    breadcrumb: 'Courses',
  },
  [TEACHER_ROUTES.batches]: {
    title: 'Batches',
    description: 'Manage live learner groups across your courses.',
    breadcrumb: 'Batches',
  },
  [TEACHER_ROUTES.lessons]: {
    title: 'Lessons',
    description: 'Author and organize lesson content across your courses.',
    breadcrumb: 'Lessons',
  },
  [TEACHER_ROUTES.liveClasses]: {
    title: 'Live Classes',
    description: 'Review and manage live sessions for your batches.',
    breadcrumb: 'Live Classes',
  },
  [TEACHER_ROUTES.assignments]: {
    title: 'Assignments',
    description: 'Review assignments and open related submissions for grading.',
    breadcrumb: 'Assignments',
  },
  [TEACHER_ROUTES.submissions]: {
    title: 'Submissions',
    description: 'Review and grade student submissions across your assignments.',
    breadcrumb: 'Submissions',
  },
  [TEACHER_ROUTES.students]: {
    title: 'Students',
    description: 'View the learners enrolled in your courses and batches.',
    breadcrumb: 'Students',
  },
  [TEACHER_ROUTES.attendance]: {
    title: 'Attendance',
    description: 'Track attendance across sessions and batches.',
    breadcrumb: 'Attendance',
  },
  [TEACHER_ROUTES.certificates]: {
    title: 'Certificates',
    description: 'Track certificate eligibility and issuance for your students.',
    breadcrumb: 'Certificates',
  },
  [TEACHER_ROUTES.announcements]: {
    title: 'Announcements',
    description: 'Broadcast updates to your courses and batches. Announcements are coming soon.',
    breadcrumb: 'Announcements',
  },
  [TEACHER_ROUTES.ai]: {
    title: 'AI Studio',
    description: 'Generate summaries, quizzes, announcements, and teaching copy with AI.',
    breadcrumb: 'AI Studio',
  },
  [TEACHER_ROUTES.messages]: {
    title: 'Messages',
    description: 'Message students and cohorts in organization-scoped conversations.',
    breadcrumb: 'Messages',
  },
  [TEACHER_ROUTES.analytics]: {
    title: 'Analytics',
    description: 'Understand teaching effectiveness and cohort health from live teaching data.',
    breadcrumb: 'Analytics',
  },
  [TEACHER_ROUTES.calendar]: {
    title: 'Calendar',
    description: 'Teaching schedule across live classes, due dates, and office hours.',
    breadcrumb: 'Calendar',
  },
  [TEACHER_ROUTES.notifications]: {
    title: 'Notifications',
    description: 'Stay aware of teaching updates across your organization.',
    breadcrumb: 'Notifications',
  },
  [TEACHER_ROUTES.profile]: {
    title: 'Profile',
    description: 'Your teaching identity and professional details.',
    breadcrumb: 'Profile',
  },
  [TEACHER_ROUTES.settings]: {
    title: 'Settings',
    description: 'Appearance, notifications, and account preferences for your teaching workspace.',
    breadcrumb: 'Settings',
  },
};

const fallbackMeta: TeacherPageMeta = {
  title: 'Dashboard',
  description: 'Your teaching command center — a calm overview of today and what needs attention.',
  breadcrumb: 'Dashboard',
};

export function getTeacherPageMeta(pathname: string): TeacherPageMeta {
  return teacherPageMeta[pathname] ?? fallbackMeta;
}
