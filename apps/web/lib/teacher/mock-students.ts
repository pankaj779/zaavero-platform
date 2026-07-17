import { formatDashboardDate } from '../dashboard/format-date';

/**
 * Teacher Students DTOs — shaped like future GET /teachers/me/students responses.
 * Students belong to batches; batches belong to courses. Entities are generic and
 * course-agnostic. Graphology appears only as one enrolled course sample.
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

export const teacherStudentsViewState: TeacherStudentsViewState = 'populated';

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

/**
 * Sample roster — Graphology is one enrolled course among generic programs.
 * Shape mirrors future GET /teachers/me/students response items.
 */
export const teacherStudents: TeacherStudentSummaryDto[] = [
  {
    id: 'tstudent_001',
    fullName: 'Student Placeholder One',
    email: 'student.one@example.com',
    avatarUrl: null,
    initials: 'S1',
    batch: { id: 'tbatch_001', name: 'Graphology Foundations — Weekend Cohort' },
    course: {
      id: 'tcourse_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    enrollmentStatus: 'active',
    isAtRisk: false,
    progress: {
      percentage: 42,
      assignmentsCompleted: 2,
      assignmentsTotal: 4,
      attendancePercent: 88,
    },
    joinedAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-15T10:00:00.000Z',
  },
  {
    id: 'tstudent_002',
    fullName: 'Student Placeholder Two',
    email: 'student.two@example.com',
    avatarUrl: null,
    initials: 'S2',
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    enrollmentStatus: 'active',
    isAtRisk: true,
    progress: {
      percentage: 12,
      assignmentsCompleted: 0,
      assignmentsTotal: 6,
      attendancePercent: 45,
    },
    joinedAt: '2026-07-08T09:00:00.000Z',
    updatedAt: '2026-07-14T14:30:00.000Z',
  },
  {
    id: 'tstudent_003',
    fullName: 'Student Placeholder Three',
    email: 'student.three@example.com',
    avatarUrl: null,
    initials: 'S3',
    batch: { id: 'tbatch_003', name: 'Skills Workshop — Morning Group' },
    course: {
      id: 'tcourse_003',
      slug: 'sample-skills-workshop',
      title: 'Sample Skills Workshop',
    },
    enrollmentStatus: 'completed',
    isAtRisk: false,
    progress: {
      percentage: 100,
      assignmentsCompleted: 1,
      assignmentsTotal: 1,
      attendancePercent: 100,
    },
    joinedAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-05-16T09:00:00.000Z',
  },
  {
    id: 'tstudent_004',
    fullName: 'Student Placeholder Four',
    email: 'student.four@example.com',
    avatarUrl: null,
    initials: 'S4',
    batch: { id: 'tbatch_004', name: 'Retired Program — Archived Cohort' },
    course: {
      id: 'tcourse_004',
      slug: 'sample-retired-program',
      title: 'Sample Retired Program',
    },
    enrollmentStatus: 'inactive',
    isAtRisk: false,
    progress: {
      percentage: 55,
      assignmentsCompleted: 2,
      assignmentsTotal: 3,
      attendancePercent: 70,
    },
    joinedAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'tstudent_005',
    fullName: 'Student Placeholder Five',
    email: 'student.five@example.com',
    avatarUrl: null,
    initials: 'S5',
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    enrollmentStatus: 'active',
    isAtRisk: false,
    progress: {
      percentage: 28,
      assignmentsCompleted: 1,
      assignmentsTotal: 6,
      attendancePercent: 92,
    },
    joinedAt: '2026-07-10T09:00:00.000Z',
    updatedAt: '2026-07-16T08:00:00.000Z',
  },
];

/** Top stats derived from the mock list — mirrors a future aggregate endpoint. */
export function getTeacherStudentStats(
  students: TeacherStudentSummaryDto[],
): TeacherStudentStatDto[] {
  const total = students.length;
  const active = students.filter((student) => student.enrollmentStatus === 'active').length;
  const atRisk = students.filter((student) => student.isAtRisk).length;
  const averageProgress =
    total === 0
      ? 0
      : Math.round(
          students.reduce((sum, student) => sum + student.progress.percentage, 0) / total,
        );

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

export function filterTeacherStudents(
  students: TeacherStudentSummaryDto[],
  query: string,
  status: TeacherStudentStatusFilter,
): TeacherStudentSummaryDto[] {
  const normalized = query.trim().toLowerCase();

  return students.filter((student) => {
    const matchesStatus = status === 'all' || student.enrollmentStatus === status;
    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      student.fullName.toLowerCase().includes(normalized) ||
      student.email.toLowerCase().includes(normalized) ||
      student.batch.name.toLowerCase().includes(normalized) ||
      student.course.title.toLowerCase().includes(normalized) ||
      student.course.slug.toLowerCase().includes(normalized)
    );
  });
}

export function sortTeacherStudents(
  students: TeacherStudentSummaryDto[],
  sort: TeacherStudentSortOption,
): TeacherStudentSummaryDto[] {
  const next = [...students];

  switch (sort) {
    case 'progress':
      return next.sort((a, b) => b.progress.percentage - a.progress.percentage);
    case 'recently_joined':
      return next.sort(
        (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
      );
    case 'name':
    default:
      return next.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
}

export function formatTeacherStudentDate(iso: string | null): string {
  return formatDashboardDate(iso);
}
