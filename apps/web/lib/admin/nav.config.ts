import { ADMIN_ROUTES } from '../constants/routes';
import type { IconName } from '../constants/icons';

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

export interface AdminPageMeta {
  title: string;
  description: string;
  breadcrumb: string;
}

export const adminNavItems: AdminNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: ADMIN_ROUTES.dashboard, icon: 'dashboard' },
  { id: 'users', label: 'Users', href: ADMIN_ROUTES.users, icon: 'users' },
  { id: 'teachers', label: 'Teachers', href: ADMIN_ROUTES.teachers, icon: 'graduation' },
  { id: 'students', label: 'Students', href: ADMIN_ROUTES.students, icon: 'user' },
  { id: 'academic', label: 'Academic', href: ADMIN_ROUTES.academic, icon: 'book' },
  { id: 'organization', label: 'Organization', href: ADMIN_ROUTES.organization, icon: 'globe' },
  { id: 'roles', label: 'Roles & Permissions', href: ADMIN_ROUTES.roles, icon: 'lock' },
  { id: 'analytics', label: 'Analytics', href: ADMIN_ROUTES.analytics, icon: 'trending' },
  { id: 'payments', label: 'Payments', href: ADMIN_ROUTES.payments, icon: 'creditCard' },
  { id: 'email', label: 'Email', href: ADMIN_ROUTES.email, icon: 'mail' },
  { id: 'notifications', label: 'Notifications', href: ADMIN_ROUTES.notifications, icon: 'bell' },
  { id: 'audit-logs', label: 'Audit Logs', href: ADMIN_ROUTES.auditLogs, icon: 'clipboard' },
  { id: 'settings', label: 'Settings', href: ADMIN_ROUTES.settings, icon: 'settings' },
];

export const adminPageMeta: Record<string, AdminPageMeta> = {
  [ADMIN_ROUTES.dashboard]: {
    title: 'Admin Dashboard',
    description: 'Organization health, academic activity, and operational status.',
    breadcrumb: 'Dashboard',
  },
  [ADMIN_ROUTES.users]: {
    title: 'User Management',
    description: 'Manage administrators, teachers, students, roles, and access.',
    breadcrumb: 'Users',
  },
  [ADMIN_ROUTES.teachers]: {
    title: 'Teacher Management',
    description: 'Review teacher profiles, assignments, courses, and teaching activity.',
    breadcrumb: 'Teachers',
  },
  [ADMIN_ROUTES.students]: {
    title: 'Student Management',
    description: 'Review learner profiles, enrollments, progress, and outcomes.',
    breadcrumb: 'Students',
  },
  [ADMIN_ROUTES.academic]: {
    title: 'Academic Management',
    description: 'Manage courses, batches, lessons, assignments, sessions, and credentials.',
    breadcrumb: 'Academic',
  },
  [ADMIN_ROUTES.courses]: {
    title: 'Courses',
    description: 'Manage the organization course catalog.',
    breadcrumb: 'Courses',
  },
  [ADMIN_ROUTES.batches]: {
    title: 'Batches',
    description: 'Manage cohorts and teaching assignments.',
    breadcrumb: 'Batches',
  },
  [ADMIN_ROUTES.lessons]: {
    title: 'Lessons',
    description: 'Manage lesson content and ordering.',
    breadcrumb: 'Lessons',
  },
  [ADMIN_ROUTES.assignments]: {
    title: 'Assignments',
    description: 'Manage assignments and review status.',
    breadcrumb: 'Assignments',
  },
  [ADMIN_ROUTES.attendance]: {
    title: 'Attendance',
    description: 'Review and manage attendance records.',
    breadcrumb: 'Attendance',
  },
  [ADMIN_ROUTES.liveClasses]: {
    title: 'Live Classes',
    description: 'Manage scheduled and completed sessions.',
    breadcrumb: 'Live Classes',
  },
  [ADMIN_ROUTES.certificates]: {
    title: 'Certificates',
    description: 'Review certificate eligibility and issuance.',
    breadcrumb: 'Certificates',
  },
  [ADMIN_ROUTES.organization]: {
    title: 'Organization',
    description: 'Organization identity, locale, branding, and membership settings.',
    breadcrumb: 'Organization',
  },
  [ADMIN_ROUTES.roles]: {
    title: 'Roles & Permissions',
    description: 'Inspect RBAC roles, permissions, and assignments.',
    breadcrumb: 'Roles & Permissions',
  },
  [ADMIN_ROUTES.analytics]: {
    title: 'Organization Analytics',
    description: 'Live organization KPIs derived from existing operational data.',
    breadcrumb: 'Analytics',
  },
  [ADMIN_ROUTES.payments]: {
    title: 'Payments',
    description: 'Revenue, plans, transactions, invoices, refunds, subscriptions, and coupons.',
    breadcrumb: 'Payments',
  },
  [ADMIN_ROUTES.email]: {
    title: 'Email',
    description: 'Provider health, delivery statistics, queue operations, and templates.',
    breadcrumb: 'Email',
  },
  [ADMIN_ROUTES.notifications]: {
    title: 'Notifications',
    description: 'Review organization notifications and read state.',
    breadcrumb: 'Notifications',
  },
  [ADMIN_ROUTES.auditLogs]: {
    title: 'Audit Logs',
    description: 'Search administrative and security-relevant activity.',
    breadcrumb: 'Audit Logs',
  },
  [ADMIN_ROUTES.settings]: {
    title: 'Settings',
    description: 'Review system, security, academic, and integration configuration.',
    breadcrumb: 'Settings',
  },
};

const fallbackMeta: AdminPageMeta = {
  title: 'Admin Dashboard',
  description: 'Organization health, academic activity, and operational status.',
  breadcrumb: 'Dashboard',
};

export function getAdminPageMeta(pathname: string): AdminPageMeta {
  return adminPageMeta[pathname] ?? fallbackMeta;
}
