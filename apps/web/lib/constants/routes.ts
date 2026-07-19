export const ROUTES = {
  home: '/',
  about: '/#about',
  programs: '/#programs',
  courses: '/#programs',
  blog: '/#blog',
  contact: '/#contact',
  privacy: '/#privacy',
  terms: '/#terms',
  login: '/login',
  acceptInvitation: '/accept-invitation',
  register: '#',
  /** Post-login destination for authenticated users (role-aware override in auth-session). */
  dashboard: '/dashboard',
  mentor: '/#mentor',
  journey: '/#journey',
  benefits: '/#benefits',
  whyLearn: '/#why-learn',
  faq: '/#faq',
  testimonials: '/#testimonials',
} as const;

/** Public certificate verification path. */
export function getCertificateVerificationPath(verificationCode: string): string {
  return `/verify/${encodeURIComponent(verificationCode)}`;
}

/** Absolute public verification URL used by QR codes and copy-link actions. */
export function getCertificateVerificationUrl(verificationCode: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${baseUrl}${getCertificateVerificationPath(verificationCode)}`;
}

export const DASHBOARD_ROUTES = {
  root: '/dashboard',
  learning: '/dashboard/learning',
  progress: '/dashboard/progress',
  liveClasses: '/dashboard/live',
  assignments: '/dashboard/assignments',
  attendance: '/dashboard/attendance',
  certificates: '/dashboard/certificates',
  payments: '/dashboard/payments',
  calendar: '/dashboard/calendar',
  notifications: '/dashboard/notifications',
  messages: '/dashboard/messages',
  ai: '/dashboard/ai',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
} as const;

/** Printable invoice receipt path. */
export function getPaymentReceiptPath(invoiceId: string): string {
  return `${DASHBOARD_ROUTES.payments}/receipts/${encodeURIComponent(invoiceId)}`;
}

/**
 * Teacher Portal routes.
 * Independent from the student `/dashboard` tree; course-agnostic segments only.
 */
export const TEACHER_ROUTES = {
  root: '/teacher',
  dashboard: '/teacher/dashboard',
  courses: '/teacher/courses',
  batches: '/teacher/batches',
  lessons: '/teacher/lessons',
  liveClasses: '/teacher/live',
  assignments: '/teacher/assignments',
  submissions: '/teacher/submissions',
  students: '/teacher/students',
  attendance: '/teacher/attendance',
  certificates: '/teacher/certificates',
  announcements: '/teacher/announcements',
  ai: '/teacher/ai',
  messages: '/teacher/messages',
  analytics: '/teacher/analytics',
  calendar: '/teacher/calendar',
  notifications: '/teacher/notifications',
  profile: '/teacher/profile',
  settings: '/teacher/settings',
} as const;

export const ADMIN_ROUTES = {
  root: '/admin',
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  teachers: '/admin/teachers',
  students: '/admin/students',
  academic: '/admin/academic',
  courses: '/admin/academic/courses',
  batches: '/admin/academic/batches',
  lessons: '/admin/academic/lessons',
  assignments: '/admin/academic/assignments',
  attendance: '/admin/academic/attendance',
  liveClasses: '/admin/academic/live',
  certificates: '/admin/academic/certificates',
  organization: '/admin/organization',
  roles: '/admin/roles',
  analytics: '/admin/analytics',
  payments: '/admin/payments',
  email: '/admin/email',
  ai: '/admin/ai',
  notifications: '/admin/notifications',
  auditLogs: '/admin/audit-logs',
  settings: '/admin/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
export type DashboardRoute = (typeof DASHBOARD_ROUTES)[keyof typeof DASHBOARD_ROUTES];
export type TeacherRoute = (typeof TEACHER_ROUTES)[keyof typeof TEACHER_ROUTES];
export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];

/** Where auth should send users after successful login. */
export const POST_LOGIN_REDIRECT = DASHBOARD_ROUTES.root;

/** Dynamic course details path — supports any future courseId/slug. */
export function getCourseDetailsPath(courseId: string): string {
  return `${DASHBOARD_ROUTES.learning}/${courseId}`;
}

/** Dynamic lesson player path — supports any future courseId/slug + lessonId. */
export function getLessonPath(courseId: string, lessonId: string): string {
  return `${getCourseDetailsPath(courseId)}/lesson/${lessonId}`;
}
