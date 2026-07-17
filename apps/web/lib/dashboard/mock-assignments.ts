import { formatDashboardDate } from './format-date';

/**
 * Assignments DTOs — shaped like future GET /student/assignments responses.
 * Honest placeholders only: no fake grades, feedback, or uploaded files.
 */

export type AssignmentsViewState = 'loading' | 'empty' | 'error' | 'populated';

export type AssignmentStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'overdue'
  | 'locked';

export type AssignmentPriority = 'low' | 'medium' | 'high';

export type AssignmentSubmissionStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'resubmission_required'
  | 'locked';

export type AssignmentSortOption = 'newest' | 'oldest' | 'due_soon';
export type AssignmentStatusFilter = 'all' | AssignmentStatus;

export interface AssignmentMentorDto {
  id: string;
  name: string;
}

export interface AssignmentDurationDto {
  minutes: number;
  label: string;
}

export interface AssignmentAttachmentDto {
  id: string;
  title: string;
  fileName: string | null;
  /** Always null until storage integration */
  url: string | null;
  mimeTypePlaceholder: string;
}

export interface AssignmentFeedbackDto {
  summary: string | null;
  comments: string | null;
  gradedAt: string | null;
}

export interface AssignmentMarksDto {
  total: number | null;
  obtained: number | null;
  label: string;
}

export interface AssignmentProgressDto {
  percentage: number;
  label: string;
}

/** Future expansion — architecture only */
export interface AssignmentFutureFeaturesDto {
  uploadEnabled: boolean;
  s3Enabled: boolean;
  r2Enabled: boolean;
  multipleAttemptsEnabled: boolean;
  teacherGradingEnabled: boolean;
  rubricsEnabled: boolean;
  marksEnabled: boolean;
  feedbackEnabled: boolean;
  commentsEnabled: boolean;
  versionHistoryEnabled: boolean;
  submissionHistoryEnabled: boolean;
  latePenaltiesEnabled: boolean;
  plagiarismReportsEnabled: boolean;
}

export interface AssignmentDto {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  mentor: AssignmentMentorDto;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  totalMarks: number | null;
  /** Always null until grading exists — never invent scores */
  obtainedMarks: number | null;
  submissionStatus: AssignmentSubmissionStatus;
  /** null until a real submission exists */
  submissionDate: string | null;
  feedback: AssignmentFeedbackDto;
  attachments: AssignmentAttachmentDto[];
  instructions: string;
  requirements: string[];
  estimatedDuration: AssignmentDurationDto;
  allowedAttempts: number | null;
  attemptsUsed: number;
  progress: AssignmentProgressDto;
  marks: AssignmentMarksDto;
  futureFeatures: AssignmentFutureFeaturesDto;
}

export interface AssignmentStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const assignmentsViewState: AssignmentsViewState = 'populated';

export const assignmentsPageCopy = {
  title: 'Assignments',
  description: 'Review instructions and track upcoming deadlines. Submissions will open soon.',
  searchPlaceholder: 'Search assignments',
  searchLabel: 'Search by course, title, or mentor',
  statusFilterLabel: 'Filter by status',
  sortLabel: 'Sort assignments',
  statsLabel: 'Assignment statistics',
  upcomingTitle: 'Upcoming Deadline',
  upcomingEmpty: 'No upcoming deadlines right now.',
  gridLabel: 'Your assignments',
  detailsTitle: 'Assignment Details',
  detailsEmpty: 'Select an assignment to view details.',
  viewDetails: 'View Details',
  submitComingSoon: 'Coming Soon',
  submissionTitle: 'Submission',
  uploadPlaceholder: 'Upload area placeholder',
  acceptedFormats: 'Accepted formats: PDF, DOC, DOCX, PNG, JPG (placeholder)',
  maxSize: 'Maximum size: size limit placeholder',
  submissionStatusLabel: 'Submission status',
  emptyTitle: 'No assignments yet',
  emptyDescription:
    'When mentors assign work for your courses, it will appear here with due dates and instructions.',
  errorTitle: 'Unable to load assignments',
  errorDescription: 'Something went wrong while loading assignments. Please try again.',
  courseLabel: 'Course',
  dueLabel: 'Due',
  priorityLabel: 'Priority',
  statusLabel: 'Status',
  durationLabel: 'Estimated time',
  mentorLabel: 'Mentor',
  instructionsLabel: 'Instructions',
  requirementsLabel: 'Requirements',
  attemptsLabel: 'Allowed attempts',
  attachmentsLabel: 'Attachments',
  marksLabel: 'Marks',
  marksPlaceholder: 'Marks unavailable until grading is enabled',
  feedbackPlaceholder: 'Feedback will appear here after review',
  attachmentsEmpty: 'No attachments yet',
  progressLabel: 'Progress',
} as const;

export const assignmentStatusLabel: Record<AssignmentStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  overdue: 'Overdue',
  locked: 'Locked',
};

export const assignmentPriorityLabel: Record<AssignmentPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const assignmentSubmissionStatusLabel: Record<AssignmentSubmissionStatus, string> = {
  not_started: 'Not started',
  draft: 'Draft',
  submitted: 'Submitted',
  resubmission_required: 'Resubmission required',
  locked: 'Locked',
};

export const assignmentStatusFilterOptions: {
  value: AssignmentStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'locked', label: 'Locked' },
];

export const assignmentSortOptions: { value: AssignmentSortOption; label: string }[] = [
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const defaultFutureFeatures: AssignmentFutureFeaturesDto = {
  uploadEnabled: false,
  s3Enabled: false,
  r2Enabled: false,
  multipleAttemptsEnabled: false,
  teacherGradingEnabled: false,
  rubricsEnabled: false,
  marksEnabled: false,
  feedbackEnabled: false,
  commentsEnabled: false,
  versionHistoryEnabled: false,
  submissionHistoryEnabled: false,
  latePenaltiesEnabled: false,
  plagiarismReportsEnabled: false,
};

const placeholderMentor: AssignmentMentorDto = {
  id: 'teacher_001',
  name: 'Placeholder Instructor',
};

function daysFromNow(days: number, hour = 18): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function createAssignment(input: {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate: string;
  createdAt: string;
  submissionStatus: AssignmentSubmissionStatus;
  progress: number;
  estimatedMinutes: number;
  requirements: string[];
  instructions: string;
  allowedAttempts: number | null;
  totalMarks: number | null;
}): AssignmentDto {
  return {
    id: input.id,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    title: input.title,
    description: input.description,
    mentor: placeholderMentor,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    totalMarks: input.totalMarks,
    obtainedMarks: null,
    submissionStatus: input.submissionStatus,
    submissionDate: null,
    feedback: {
      summary: null,
      comments: null,
      gradedAt: null,
    },
    attachments: [
      {
        id: `${input.id}_att_brief`,
        title: 'Assignment brief placeholder',
        fileName: null,
        url: null,
        mimeTypePlaceholder: 'application/pdf',
      },
    ],
    instructions: input.instructions,
    requirements: input.requirements,
    estimatedDuration: {
      minutes: input.estimatedMinutes,
      label: `${String(input.estimatedMinutes)} min`,
    },
    allowedAttempts: input.allowedAttempts,
    attemptsUsed: 0,
    progress: {
      percentage: input.progress,
      label: assignmentsPageCopy.progressLabel,
    },
    marks: {
      total: input.totalMarks,
      obtained: null,
      label: assignmentsPageCopy.marksPlaceholder,
    },
    futureFeatures: defaultFutureFeatures,
  };
}

export const assignments: AssignmentDto[] = [
  createAssignment({
    id: 'assignment_001',
    courseId: 'course_001',
    courseTitle: 'Graphology Foundations',
    title: 'Baseline Observation Worksheet',
    description: 'Assignment description placeholder for observing baseline patterns.',
    status: 'in_progress',
    priority: 'high',
    dueDate: daysFromNow(2),
    createdAt: daysAgo(5),
    submissionStatus: 'draft',
    progress: 40,
    estimatedMinutes: 45,
    allowedAttempts: 2,
    totalMarks: null,
    instructions:
      'Instructions placeholder. Complete the worksheet using samples from your course module. Do not upload files yet — submission opens in a later release.',
    requirements: [
      'Review Module 1 lessons before starting',
      'Use the provided sample set placeholder',
      'Note three baseline observations',
    ],
  }),
  createAssignment({
    id: 'assignment_002',
    courseId: 'course_001',
    courseTitle: 'Graphology Foundations',
    title: 'Stroke Pressure Reflection',
    description: 'Assignment description placeholder for pressure reflection notes.',
    status: 'pending',
    priority: 'medium',
    dueDate: daysFromNow(6),
    createdAt: daysAgo(2),
    submissionStatus: 'not_started',
    progress: 0,
    estimatedMinutes: 30,
    allowedAttempts: 1,
    totalMarks: null,
    instructions:
      'Instructions placeholder. Write a short reflection on stroke pressure concepts covered in class.',
    requirements: [
      'Minimum length placeholder',
      'Reference at least one lesson concept',
      'Keep claims observational, not diagnostic',
    ],
  }),
  createAssignment({
    id: 'assignment_003',
    courseId: 'course_002',
    courseTitle: 'Advanced Graphology',
    title: 'Comparative Sample Notes',
    description: 'Assignment description placeholder for comparative analysis notes.',
    status: 'overdue',
    priority: 'high',
    dueDate: daysFromNow(-1),
    createdAt: daysAgo(10),
    submissionStatus: 'not_started',
    progress: 15,
    estimatedMinutes: 60,
    allowedAttempts: 2,
    totalMarks: null,
    instructions:
      'Instructions placeholder. Compare two handwriting samples and list structural differences.',
    requirements: [
      'Use anonymized sample placeholders only',
      'List at least five observational differences',
      'Submit when upload support is available',
    ],
  }),
  createAssignment({
    id: 'assignment_004',
    courseId: 'course_003',
    courseTitle: 'Handwriting Improvement',
    title: 'Practice Sheet Set A',
    description: 'Assignment description placeholder for practice sheets.',
    status: 'submitted',
    priority: 'low',
    dueDate: daysFromNow(1),
    createdAt: daysAgo(12),
    submissionStatus: 'submitted',
    progress: 100,
    estimatedMinutes: 25,
    allowedAttempts: 3,
    totalMarks: null,
    instructions:
      'Instructions placeholder. Practice sheet completion confirmation — file upload remains disabled.',
    requirements: ['Complete all rows on Practice Sheet Set A', 'Photograph or scan when uploads open'],
  }),
  createAssignment({
    id: 'assignment_005',
    courseId: 'course_002',
    courseTitle: 'Advanced Graphology',
    title: 'Locked Capstone Brief',
    description: 'Assignment description placeholder for a locked upcoming brief.',
    status: 'locked',
    priority: 'medium',
    dueDate: daysFromNow(14),
    createdAt: daysAgo(1),
    submissionStatus: 'locked',
    progress: 0,
    estimatedMinutes: 90,
    allowedAttempts: null,
    totalMarks: null,
    instructions:
      'Instructions placeholder. This assignment unlocks after prerequisite modules are completed.',
    requirements: ['Complete prerequisite modules', 'Unlock criteria will be shown later'],
  }),
];

export function getAssignmentStats(items: AssignmentDto[] = assignments): AssignmentStatDto[] {
  const pending = items.filter(
    (item) => item.status === 'pending' || item.status === 'in_progress',
  ).length;
  const completed = items.filter((item) => item.status === 'submitted').length;
  const upcoming = items.filter((item) => {
    const due = new Date(item.dueDate).getTime();
    return (
      due >= Date.now() &&
      item.status !== 'submitted' &&
      item.status !== 'locked' &&
      item.status !== 'overdue'
    );
  }).length;

  return [
    {
      id: 'total',
      label: 'Assignments Total',
      value: String(items.length),
      helper: 'Across enrolled programs',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: String(pending),
      helper: 'Not yet submitted',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: String(completed),
      helper: 'Submitted (grading later)',
    },
    {
      id: 'upcoming',
      label: 'Upcoming Deadlines',
      value: String(upcoming),
      helper: 'Due in the future',
    },
  ];
}

export function getUpcomingDeadline(items: AssignmentDto[] = assignments): AssignmentDto | null {
  const now = Date.now();
  return (
    [...items]
      .filter(
        (item) =>
          item.status !== 'locked' &&
          item.status !== 'submitted' &&
          new Date(item.dueDate).getTime() >= now,
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null
  );
}

export function filterAssignments(
  items: AssignmentDto[],
  query: string,
  status: AssignmentStatusFilter,
): AssignmentDto[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesStatus = status === 'all' || item.status === status;
    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      item.title.toLowerCase().includes(normalized) ||
      item.courseTitle.toLowerCase().includes(normalized) ||
      item.mentor.name.toLowerCase().includes(normalized)
    );
  });
}

export function sortAssignments(
  items: AssignmentDto[],
  sort: AssignmentSortOption,
): AssignmentDto[] {
  const next = [...items];

  switch (sort) {
    case 'newest':
      return next.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'oldest':
      return next.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case 'due_soon':
    default:
      return next.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
}

export function formatAssignmentDate(iso: string): string {
  return formatDashboardDate(iso);
}

export function getAssignmentById(
  id: string,
  items: AssignmentDto[] = assignments,
): AssignmentDto | null {
  return items.find((item) => item.id === id) ?? null;
}
