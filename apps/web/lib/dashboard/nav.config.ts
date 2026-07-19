import type { IconName } from '../constants/icons';
import { DASHBOARD_ROUTES } from '../constants/routes';

export interface DashboardNavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

export const dashboardNavItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: DASHBOARD_ROUTES.root, icon: 'dashboard' },
  { id: 'learning', label: 'My Courses', href: DASHBOARD_ROUTES.learning, icon: 'book' },
  { id: 'progress', label: 'My Progress', href: DASHBOARD_ROUTES.progress, icon: 'trending' },
  { id: 'live-classes', label: 'Live Classes', href: DASHBOARD_ROUTES.liveClasses, icon: 'video' },
  {
    id: 'assignments',
    label: 'Assignments',
    href: DASHBOARD_ROUTES.assignments,
    icon: 'clipboard',
  },
  { id: 'attendance', label: 'Attendance', href: DASHBOARD_ROUTES.attendance, icon: 'check' },
  { id: 'certificates', label: 'Certificates', href: DASHBOARD_ROUTES.certificates, icon: 'award' },
  { id: 'payments', label: 'Payments', href: DASHBOARD_ROUTES.payments, icon: 'creditCard' },
  { id: 'calendar', label: 'Calendar', href: DASHBOARD_ROUTES.calendar, icon: 'calendar' },
  {
    id: 'notifications',
    label: 'Notifications',
    href: DASHBOARD_ROUTES.notifications,
    icon: 'bell',
  },
  { id: 'messages', label: 'Messages', href: DASHBOARD_ROUTES.messages, icon: 'message' },
  { id: 'ai', label: 'AI Tutor', href: DASHBOARD_ROUTES.ai, icon: 'lightbulb' },
  { id: 'profile', label: 'Profile', href: DASHBOARD_ROUTES.profile, icon: 'user' },
  { id: 'settings', label: 'Settings', href: DASHBOARD_ROUTES.settings, icon: 'settings' },
];

export const dashboardPageMeta: Record<
  string,
  { title: string; description: string; breadcrumb: string }
> = {
  [DASHBOARD_ROUTES.root]: {
    title: 'Dashboard',
    description: 'See what matters today and continue learning without friction.',
    breadcrumb: 'Dashboard',
  },
  [DASHBOARD_ROUTES.learning]: {
    title: 'My Courses',
    description: 'Programs you are enrolled in — continue where you left off.',
    breadcrumb: 'My Courses',
  },
  [DASHBOARD_ROUTES.progress]: {
    title: 'My Progress',
    description: 'Track completion, streaks, and how your learning is advancing.',
    breadcrumb: 'My Progress',
  },
  [DASHBOARD_ROUTES.liveClasses]: {
    title: 'Live Classes',
    description: 'Join upcoming sessions and prepare for live learning with your mentor.',
    breadcrumb: 'Live Classes',
  },
  [DASHBOARD_ROUTES.assignments]: {
    title: 'Assignments',
    description: 'Track deadlines, review instructions, and prepare submissions for your courses.',
    breadcrumb: 'Assignments',
  },
  [DASHBOARD_ROUTES.attendance]: {
    title: 'Attendance',
    description: 'Review your session attendance across enrolled courses and batches.',
    breadcrumb: 'Attendance',
  },
  [DASHBOARD_ROUTES.certificates]: {
    title: 'Certificates',
    description:
      'Track issued certificates and prepare for verification once generation is enabled.',
    breadcrumb: 'Certificates',
  },
  [DASHBOARD_ROUTES.payments]: {
    title: 'Payments',
    description: 'Purchase courses, review invoices, and manage your subscription.',
    breadcrumb: 'Payments',
  },
  [DASHBOARD_ROUTES.calendar]: {
    title: 'Calendar',
    description: 'Classes, deadlines, and learning events on your calendar.',
    breadcrumb: 'Calendar',
  },
  [DASHBOARD_ROUTES.notifications]: {
    title: 'Notifications',
    description: 'Review learning alerts and mark updates as read.',
    breadcrumb: 'Notifications',
  },
  [DASHBOARD_ROUTES.messages]: {
    title: 'Messages',
    description: 'Mentor and course conversations — read, reply, and stay in sync.',
    breadcrumb: 'Messages',
  },
  [DASHBOARD_ROUTES.ai]: {
    title: 'AI Tutor',
    description: 'Ask questions about your courses with streaming answers and citations.',
    breadcrumb: 'AI Tutor',
  },
  [DASHBOARD_ROUTES.profile]: {
    title: 'Profile',
    description: 'View your learner profile and organization details.',
    breadcrumb: 'Profile',
  },
  [DASHBOARD_ROUTES.settings]: {
    title: 'Settings',
    description: 'Appearance, notifications, privacy, and account preference placeholders.',
    breadcrumb: 'Settings',
  },
};

export function getDashboardPageMeta(pathname: string): {
  title: string;
  description: string;
  breadcrumb: string;
} {
  if (dashboardPageMeta[pathname]) {
    return dashboardPageMeta[pathname];
  }

  if (pathname.startsWith(`${DASHBOARD_ROUTES.payments}/receipts/`)) {
    return {
      title: 'Payment receipt',
      description: 'Printable invoice receipt for your payment.',
      breadcrumb: 'Receipt',
    };
  }

  if (pathname.startsWith(`${DASHBOARD_ROUTES.payments}/`)) {
    return (
      dashboardPageMeta[DASHBOARD_ROUTES.payments] ?? {
        title: 'Payments',
        description: 'Purchase courses, review invoices, and manage your subscription.',
        breadcrumb: 'Payments',
      }
    );
  }

  return {
    title: 'Dashboard',
    description: 'See what matters today and continue learning without friction.',
    breadcrumb: 'Dashboard',
  };
}
