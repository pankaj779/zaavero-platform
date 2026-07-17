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
  { id: 'learning', label: 'My Learning', href: DASHBOARD_ROUTES.learning, icon: 'book' },
  { id: 'live-classes', label: 'Live Classes', href: DASHBOARD_ROUTES.liveClasses, icon: 'video' },
  { id: 'assignments', label: 'Assignments', href: DASHBOARD_ROUTES.assignments, icon: 'clipboard' },
  { id: 'certificates', label: 'Certificates', href: DASHBOARD_ROUTES.certificates, icon: 'award' },
  { id: 'notifications', label: 'Notifications', href: DASHBOARD_ROUTES.notifications, icon: 'bell' },
  { id: 'calendar', label: 'Calendar', href: DASHBOARD_ROUTES.calendar, icon: 'calendar' },
  { id: 'messages', label: 'Messages', href: DASHBOARD_ROUTES.messages, icon: 'message' },
  { id: 'payments', label: 'Payments', href: DASHBOARD_ROUTES.payments, icon: 'creditCard' },
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
    title: 'My Learning',
    description: 'Programs you are enrolled in — continue where you left off.',
    breadcrumb: 'My Learning',
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
  [DASHBOARD_ROUTES.certificates]: {
    title: 'Certificates',
    description: 'Track issued certificates and prepare for verification once generation is enabled.',
    breadcrumb: 'Certificates',
  },
  [DASHBOARD_ROUTES.notifications]: {
    title: 'Notifications',
    description:
      'Review system updates and learning alerts. Actions remain disabled until delivery is connected.',
    breadcrumb: 'Notifications',
  },
  [DASHBOARD_ROUTES.calendar]: {
    title: 'Calendar',
    description: 'Classes, deadlines, and events will appear on your calendar.',
    breadcrumb: 'Calendar',
  },
  [DASHBOARD_ROUTES.messages]: {
    title: 'Messages',
    description: 'Mentor conversations and announcements will appear here.',
    breadcrumb: 'Messages',
  },
  [DASHBOARD_ROUTES.payments]: {
    title: 'Payments',
    description: 'Purchases, invoices, and receipts will be listed here.',
    breadcrumb: 'Payments',
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
  return (
    dashboardPageMeta[pathname] ?? {
      title: 'Dashboard',
      description: 'See what matters today and continue learning without friction.',
      breadcrumb: 'Dashboard',
    }
  );
}
