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
    description: 'Your teaching command center — a calm overview of today and what needs attention.',
    breadcrumb: 'Dashboard',
  },
  [TEACHER_ROUTES.courses]: {
    title: 'Courses',
    description: 'Create and manage the programs you teach. Course authoring is coming soon.',
    breadcrumb: 'Courses',
  },
  [TEACHER_ROUTES.batches]: {
    title: 'Batches',
    description: 'Manage live learner groups across your courses. Batch tools are coming soon.',
    breadcrumb: 'Batches',
  },
  [TEACHER_ROUTES.lessons]: {
    title: 'Lessons',
    description: 'Author lesson content and learning material. The lesson editor is coming soon.',
    breadcrumb: 'Lessons',
  },
  [TEACHER_ROUTES.liveClasses]: {
    title: 'Live Classes',
    description: 'Schedule and manage live sessions for your batches. Scheduling is coming soon.',
    breadcrumb: 'Live Classes',
  },
  [TEACHER_ROUTES.assignments]: {
    title: 'Assignments',
    description: 'Create assignments and review submissions. Grading tools are coming soon.',
    breadcrumb: 'Assignments',
  },
  [TEACHER_ROUTES.students]: {
    title: 'Students',
    description: 'View the learners enrolled in your courses. Roster management is coming soon.',
    breadcrumb: 'Students',
  },
  [TEACHER_ROUTES.attendance]: {
    title: 'Attendance',
    description: 'Track attendance across sessions and batches. Attendance marking is coming soon.',
    breadcrumb: 'Attendance',
  },
  [TEACHER_ROUTES.certificates]: {
    title: 'Certificates',
    description: 'Recommend and track certificates for your students. Issuance is coming soon.',
    breadcrumb: 'Certificates',
  },
  [TEACHER_ROUTES.announcements]: {
    title: 'Announcements',
    description: 'Broadcast updates to your courses and batches. Announcements are coming soon.',
    breadcrumb: 'Announcements',
  },
  [TEACHER_ROUTES.messages]: {
    title: 'Messages',
    description: 'Message students and cohorts. Messaging is coming soon.',
    breadcrumb: 'Messages',
  },
  [TEACHER_ROUTES.analytics]: {
    title: 'Analytics',
    description: 'Understand teaching effectiveness and cohort health. Analytics are coming soon.',
    breadcrumb: 'Analytics',
  },
  [TEACHER_ROUTES.calendar]: {
    title: 'Calendar',
    description: 'Teaching schedule across live classes, due dates, and office hours.',
    breadcrumb: 'Calendar',
  },
  [TEACHER_ROUTES.profile]: {
    title: 'Profile',
    description: 'Your teaching profile and professional details. Profile editing is coming soon.',
    breadcrumb: 'Profile',
  },
  [TEACHER_ROUTES.settings]: {
    title: 'Settings',
    description: 'Appearance, notifications, and account preferences. Settings are coming soon.',
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
