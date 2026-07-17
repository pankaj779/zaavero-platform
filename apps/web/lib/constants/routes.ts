export const ROUTES = {
  home: '/',
  about: '/#about',
  programs: '/#programs',
  courses: '/#programs',
  blog: '/#blog',
  contact: '/#contact',
  privacy: '/#privacy',
  terms: '/#terms',
  login: '#',
  register: '#',
  /** Post-login destination for authenticated users */
  dashboard: '/dashboard',
  mentor: '/#mentor',
  journey: '/#journey',
  benefits: '/#benefits',
  whyLearn: '/#why-learn',
  faq: '/#faq',
  testimonials: '/#testimonials',
} as const;

export const DASHBOARD_ROUTES = {
  root: '/dashboard',
  learning: '/dashboard/learning',
  liveClasses: '/dashboard/live',
  assignments: '/dashboard/assignments',
  certificates: '/dashboard/certificates',
  notifications: '/dashboard/notifications',
  calendar: '/dashboard/calendar',
  messages: '/dashboard/messages',
  payments: '/dashboard/payments',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
} as const;

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
  students: '/teacher/students',
  attendance: '/teacher/attendance',
  certificates: '/teacher/certificates',
  announcements: '/teacher/announcements',
  messages: '/teacher/messages',
  analytics: '/teacher/analytics',
  calendar: '/teacher/calendar',
  profile: '/teacher/profile',
  settings: '/teacher/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
export type DashboardRoute = (typeof DASHBOARD_ROUTES)[keyof typeof DASHBOARD_ROUTES];
export type TeacherRoute = (typeof TEACHER_ROUTES)[keyof typeof TEACHER_ROUTES];

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
