import { formatDashboardDate } from '../dashboard/format-date';

/**
 * Teacher Students view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherStudentEnrollmentStatus = 'active' | 'inactive' | 'completed';
export type TeacherStudentsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherStudentStatusFilter = 'all' | TeacherStudentEnrollmentStatus;
export type TeacherStudentSortOption = 'name' | 'progress' | 'recently_joined';
export type TeacherStudentsViewMode = 'grid' | 'list';

export interface TeacherStudentBatchRefDto {
  id: string;
  name: string;
}

export interface TeacherStudentCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherStudentProgressDto {
  percentage: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  attendancePercent: number;
}

/** List-item DTO for the teacher students workspace. */
export interface TeacherStudentSummaryDto {
  id: string;
  fullName: string;
  email: string;
  /** Avatar URL — null until upload/integration lands. */
  avatarUrl: string | null;
  initials: string;
  batch: TeacherStudentBatchRefDto;
  course: TeacherStudentCourseRefDto;
  enrollmentStatus: TeacherStudentEnrollmentStatus;
  /** Backend risk signal — not invented client-side. */
  isAtRisk: boolean;
  progress: TeacherStudentProgressDto;
  joinedAt: string;
  updatedAt: string;
}

export interface TeacherStudentStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherStudentsPageCopy = {
  title: 'Students',
  description: 'Learners enrolled in your courses and batches.',
  searchPlaceholder: 'Search by name, email, batch, or course',
  searchLabel: 'Search students',
  statusFilterLabel: 'Filter by enrollment status',
  sortLabel: 'Sort students',
  viewModeLabel: 'Student view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  gridLabel: 'Your students',
  emptyTitle: 'No students yet',
  emptyDescription:
    'Students enrolled in your batches will appear here. Roster tools open in a later sprint.',
  noMatchesTitle: 'No matching students',
  noMatchesDescription: 'Try a different name, email, batch, course, or status filter.',
  errorTitle: 'Unable to load your students',
  errorDescription: 'Something went wrong while loading Students. Please try again.',
  profileButton: 'Profile',
  progressButton: 'Progress',
  attendanceButton: 'Attendance',
  messageButton: 'Message',
  comingSoonNote: 'Student actions activate in a later sprint.',
  batchLabel: 'Batch',
  courseLabel: 'Course',
  emailLabel: 'Email',
  progressLabel: 'Progress',
  attendanceLabel: 'Attendance',
  assignmentsLabel: 'Assignments Completed',
  joinedLabel: 'Joined',
  atRiskLabel: 'At risk',
  avatarAlt: 'Student avatar placeholder',
} as const;

export const teacherStudentStatusLabel: Record<TeacherStudentEnrollmentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  completed: 'Completed',
};

export const teacherStudentStatusFilterOptions: {
  value: TeacherStudentStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
];

export const teacherStudentSortOptions: { value: TeacherStudentSortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'progress', label: 'Progress' },
  { value: 'recently_joined', label: 'Recently Joined' },
];

export function getTeacherStudentStats(
  students: TeacherStudentSummaryDto[],
): TeacherStudentStatDto[] {
  const total = students.length;
  const active = students.filter((student) => student.enrollmentStatus === 'active').length;
  const atRisk = students.filter((student) => student.isAtRisk).length;
  const averageProgress =
    total === 0
      ? 0
      : Math.round(students.reduce((sum, student) => sum + student.progress.percentage, 0) / total);

  return [
    {
      id: 'total-students',
      label: 'Total Students',
      value: String(total),
      helper: 'Learners across your batches.',
    },
    {
      id: 'active-students',
      label: 'Active Students',
      value: String(active),
      helper: 'Currently enrolled and active.',
    },
    {
      id: 'at-risk-students',
      label: 'At Risk Students',
      value: String(atRisk),
      helper: 'Flagged by progress or attendance signals.',
    },
    {
      id: 'average-progress',
      label: 'Average Progress',
      value: `${String(averageProgress)}%`,
      helper: 'Mean completion across this roster.',
    },
  ];
}

export function formatTeacherStudentDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

/**
 * Maps UI sort option → NestJS list query params when supported.
 * `name` / `progress` are not API sort fields — callers may re-sort client-side.
 */
export function toEnrollmentListSort(sort: TeacherStudentSortOption): {
  sortBy: 'enrolledAt' | 'updatedAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'recently_joined':
      return { sortBy: 'enrolledAt', sortOrder: 'desc' };
    case 'name':
    case 'progress':
    default:
      return { sortBy: 'enrolledAt', sortOrder: 'desc' };
  }
}

/**
 * Maps UI status filter → NestJS status enum (undefined = all).
 * UI `inactive` maps to API `DROPPED` (closest backend equivalent for soft-inactive).
 * `SUSPENDED` is not exposed as a separate UI filter yet.
 */
export function toEnrollmentApiStatus(
  status: TeacherStudentStatusFilter,
): 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED' | undefined {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'completed':
      return 'COMPLETED';
    case 'inactive':
      return 'DROPPED';
    case 'all':
    default:
      return undefined;
  }
}

/** Client-side sort for options the Enrollment API does not support. */
export function sortTeacherStudents(
  students: TeacherStudentSummaryDto[],
  sort: TeacherStudentSortOption,
): TeacherStudentSummaryDto[] {
  const next = [...students];

  switch (sort) {
    case 'progress':
      return next.sort((a, b) => b.progress.percentage - a.progress.percentage);
    case 'recently_joined':
      return next.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
    case 'name':
    default:
      return next.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
}
