import type { TeacherAssignmentDto } from './assignment-types';
import type { AttendanceSessionDto } from './attendance-types';
import type { StudentCertificateDto } from './certificate-types';
import type { TeacherCourseSummaryDto } from './course-types';
import type { TeacherLiveClassDto } from './live-session-types';
import type { TeacherStudentSummaryDto } from './student-types';
import type { TeacherSubmissionSummaryDto } from './submission-types';

export type TeacherAnalyticsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherAnalyticsTimeRange = '7d' | '30d' | '90d' | '1y';
export type TeacherAnalyticsChartType = 'line' | 'bar' | 'pie' | 'area';
export type TeacherAnalyticsMetricKind = 'kpi' | 'section';

export interface TeacherAnalyticsCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherAnalyticsMetricDto {
  id: string;
  kind: TeacherAnalyticsMetricKind;
  label: string;
  value: string;
  helper: string;
  description: string;
  calculationSource: string;
  futureApi: string;
  notes: string;
  courseId: string | null;
}

export interface TeacherAnalyticsSectionDto {
  id: string;
  title: string;
  description: string;
  chartType: TeacherAnalyticsChartType;
  chartTypeLabel: string;
  metricId: string;
  courseId: string | null;
}

export interface TeacherAnalyticsOverviewDto {
  timeRange: TeacherAnalyticsTimeRange;
  courses: TeacherAnalyticsCourseRefDto[];
  kpis: TeacherAnalyticsMetricDto[];
  sections: TeacherAnalyticsSectionDto[];
  metrics: TeacherAnalyticsMetricDto[];
}

export interface TeacherAnalyticsSourceDto {
  courses: TeacherCourseSummaryDto[];
  students: TeacherStudentSummaryDto[];
  assignments: TeacherAssignmentDto[];
  submissions: TeacherSubmissionSummaryDto[];
  attendanceSessions: AttendanceSessionDto[];
  liveSessions: TeacherLiveClassDto[];
  certificates: StudentCertificateDto[];
}

export const teacherAnalyticsPageCopy = {
  title: 'Analytics',
  description: 'Read-only overview of teaching effectiveness and cohort health.',
  searchPlaceholder: 'Search by course',
  searchLabel: 'Search analytics by course',
  timeRangeLabel: 'Filter by time range',
  emptyTitle: 'No analytics yet',
  emptyDescription: 'Analytics appear once courses and teaching activity are available.',
  noMatchesTitle: 'No matching analytics',
  noMatchesDescription: 'Try a different course name or time range.',
  errorTitle: 'Unable to load analytics',
  errorDescription: 'Something went wrong while loading Analytics. Please try again.',
  retryButton: 'Retry',
  kpiLabel: 'Key performance indicators',
  sectionsLabel: 'Analytics sections',
  chartPlaceholderNote: 'Summary for the selected reporting range.',
  exportButton: 'Export Report',
  downloadPdfButton: 'Download PDF',
  emailReportButton: 'Email Report',
  comparePeriodsButton: 'Compare Periods',
  comingSoonNote: 'Report delivery requires a reporting backend.',
  detailsButton: 'View details',
  detailsPanelLabel: 'Metric details',
  detailsCloseLabel: 'Close metric details',
  descriptionLabel: 'Metric description',
  calculationSourceLabel: 'Calculation source',
  futureApiLabel: 'Data source',
  notesLabel: 'Notes',
  placeholderValue: '—',
  timeRangeNote: 'Activity-based metrics use the selected reporting range.',
} as const;

export const teacherAnalyticsChartTypeLabel: Record<TeacherAnalyticsChartType, string> = {
  line: 'Trend Summary',
  bar: 'Volume Summary',
  pie: 'Status Summary',
  area: 'Progress Summary',
};

export const teacherAnalyticsTimeRangeOptions: {
  value: TeacherAnalyticsTimeRange;
  label: string;
}[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

const rangeDays: Record<TeacherAnalyticsTimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

function isWithinRange(value: string | null, range: TeacherAnalyticsTimeRange, now: Date): boolean {
  if (value === null) {
    return false;
  }
  const timestamp = new Date(value).getTime();
  const start = now.getTime() - rangeDays[range] * 24 * 60 * 60 * 1000;
  return Number.isFinite(timestamp) && timestamp >= start && timestamp <= now.getTime();
}

function percent(numerator: number, denominator: number): string {
  return denominator === 0 ? '—' : `${String(Math.round((numerator / denominator) * 100))}%`;
}

function metric(
  id: string,
  kind: TeacherAnalyticsMetricKind,
  label: string,
  value: string,
  helper: string,
  description: string,
  calculationSource: string,
  notes: string,
  courseId: string | null = null,
): TeacherAnalyticsMetricDto {
  return {
    id,
    kind,
    label,
    value,
    helper,
    description,
    calculationSource,
    futureApi: 'Existing Teacher Portal APIs',
    notes,
    courseId,
  };
}

export function buildTeacherAnalyticsOverview(
  source: TeacherAnalyticsSourceDto,
  timeRange: TeacherAnalyticsTimeRange,
  now = new Date(),
): TeacherAnalyticsOverviewDto {
  const courses = source.courses.map(({ id, slug, title }) => ({ id, slug, title }));
  const activeStudents = source.students.filter((student) => student.enrollmentStatus === 'active');
  const completedStudents = source.students.filter(
    (student) => student.enrollmentStatus === 'completed',
  );
  const publishedCourses = source.courses.filter((course) => course.status === 'published');
  const rangeSubmissions = source.submissions.filter((submission) =>
    isWithinRange(submission.submittedAt ?? submission.updatedAt, timeRange, now),
  );
  const receivedSubmissions = rangeSubmissions.filter(
    (submission) => submission.status !== 'pending',
  );
  const gradedSubmissions = rangeSubmissions.filter(
    (submission) => submission.status === 'graded' || submission.status === 'returned',
  );
  const rangeAttendance = source.attendanceSessions.filter((session) =>
    isWithinRange(session.sessionDate, timeRange, now),
  );
  const attendanceRecords = rangeAttendance.flatMap((session) => session.records);
  const presentCount = attendanceRecords.filter((record) => record.status === 'present').length;
  const rangeLiveSessions = source.liveSessions.filter((session) =>
    isWithinRange(session.startsAt, timeRange, now),
  );
  const completedSessions = rangeLiveSessions.filter(
    (session) => session.status === 'completed',
  ).length;
  const rangeCertificates = source.certificates.filter((certificate) =>
    isWithinRange(certificate.issuedAt, timeRange, now),
  );
  const upcomingAssignments = source.assignments.filter(
    (assignment) =>
      assignment.dueAt !== null &&
      new Date(assignment.dueAt).getTime() >= now.getTime() &&
      assignment.status !== 'archived' &&
      assignment.status !== 'closed',
  );
  const upcomingSessions = source.liveSessions.filter(
    (session) =>
      new Date(session.startsAt).getTime() >= now.getTime() &&
      (session.status === 'scheduled' || session.status === 'live'),
  );
  const firstCourseId = courses[0]?.id ?? null;

  const kpis = [
    metric(
      'kpi-total-students',
      'kpi',
      'Total Students',
      String(activeStudents.length),
      'Active enrollment records in your teaching scope.',
      'Current active learners across accessible courses and batches.',
      'Enrollment list, organization-scoped by the API.',
      'A learner enrolled in multiple courses is represented once per enrollment.',
    ),
    metric(
      'kpi-active-courses',
      'kpi',
      'Active Courses',
      String(publishedCourses.length),
      'Published courses currently available to learners.',
      'Published courses in the active organization.',
      'Course list filtered from live API records.',
      'Archived and draft courses are excluded.',
    ),
    metric(
      'kpi-assignment-submission-rate',
      'kpi',
      'Assignment Submission Rate',
      percent(receivedSubmissions.length, rangeSubmissions.length),
      `${String(receivedSubmissions.length)} of ${String(rangeSubmissions.length)} submission records received.`,
      'Share of submission records that moved beyond pending in the selected range.',
      'Submission status and submitted/updated timestamps.',
      'This is record-based until the backend exposes expected-submission aggregates.',
    ),
    metric(
      'kpi-average-attendance',
      'kpi',
      'Average Attendance',
      percent(presentCount, attendanceRecords.length),
      `${String(presentCount)} present marks across ${String(attendanceRecords.length)} attendance records.`,
      'Present attendance marks as a share of recorded attendance in the selected range.',
      'Attendance records grouped by live session.',
      'Sessions without attendance records are excluded.',
    ),
    metric(
      'kpi-course-completion',
      'kpi',
      'Course Completion',
      percent(completedStudents.length, source.students.length),
      `${String(completedStudents.length)} completed enrollment records.`,
      'Completed enrollment records as a share of all accessible enrollment records.',
      'Enrollment status from the live API.',
      'Completion criteria are controlled by the backend enrollment lifecycle.',
    ),
    metric(
      'kpi-student-satisfaction',
      'kpi',
      'Student Satisfaction',
      '—',
      'Feedback surveys are not supported by the backend.',
      'Future learner feedback and satisfaction score.',
      'No existing backend data source.',
      'Intentionally unavailable; no value is fabricated.',
    ),
  ];

  const sectionMetrics = [
    metric(
      'section-course-performance',
      'section',
      'Course Performance',
      `${String(publishedCourses.length)} active`,
      `${String(source.courses.length)} courses in scope.`,
      'Current published and total course volume.',
      'Course status records.',
      'Outcome comparison requires a dedicated aggregate endpoint.',
      firstCourseId,
    ),
    metric(
      'section-student-progress',
      'section',
      'Student Progress',
      percent(completedStudents.length, source.students.length),
      `${String(activeStudents.length)} active and ${String(completedStudents.length)} completed enrollments.`,
      'Enrollment lifecycle progress across accessible learners.',
      'Enrollment status records.',
      'Lesson-level completion trends require lesson-progress aggregation.',
      firstCourseId,
    ),
    metric(
      'section-assignment-statistics',
      'section',
      'Assignment Statistics',
      `${String(receivedSubmissions.length)} received`,
      `${String(gradedSubmissions.length)} graded or returned in range.`,
      'Submission and grading volume for the selected range.',
      'Assignment and submission records.',
      `${String(source.assignments.length)} assignments are currently accessible.`,
      firstCourseId,
    ),
    metric(
      'section-attendance-trends',
      'section',
      'Attendance Trends',
      percent(presentCount, attendanceRecords.length),
      `${String(rangeAttendance.length)} sessions with attendance activity in range.`,
      'Recorded attendance performance for the selected range.',
      'Attendance session and roster records.',
      'Trend points require an aggregate time-series endpoint.',
      firstCourseId,
    ),
    metric(
      'section-live-class-summary',
      'section',
      'Live Class Summary',
      `${String(completedSessions)} completed`,
      `${String(rangeLiveSessions.length)} live sessions in range.`,
      'Live session status volume for the selected range.',
      'Live session status and schedule records.',
      'Cancelled and scheduled sessions remain included in the total.',
      firstCourseId,
    ),
    metric(
      'section-certificates-issued',
      'section',
      'Certificates Issued',
      String(rangeCertificates.length),
      'Issued certificates in the selected range.',
      'Certificate issuance volume for accessible courses.',
      'Certificate issue timestamps.',
      'PDF rendering and delivery are separate backend capabilities.',
      firstCourseId,
    ),
    metric(
      'section-upcoming-activities',
      'section',
      'Upcoming Activities',
      String(upcomingAssignments.length + upcomingSessions.length),
      `${String(upcomingSessions.length)} sessions and ${String(upcomingAssignments.length)} assignment deadlines.`,
      'Scheduled teaching work from live sessions and assignment due dates.',
      'Live session schedules and assignment deadlines.',
      'Only non-cancelled sessions and open assignments are counted.',
    ),
  ];

  const sectionDefinitions: {
    id: string;
    title: string;
    description: string;
    chartType: TeacherAnalyticsChartType;
    metricId: string;
  }[] = [
    {
      id: 'course-performance',
      title: 'Course Performance',
      description: 'Current course portfolio summary.',
      chartType: 'bar',
      metricId: 'section-course-performance',
    },
    {
      id: 'student-progress',
      title: 'Student Progress',
      description: 'Enrollment completion overview.',
      chartType: 'area',
      metricId: 'section-student-progress',
    },
    {
      id: 'assignment-statistics',
      title: 'Assignment Statistics',
      description: 'Submission and grading volume overview.',
      chartType: 'bar',
      metricId: 'section-assignment-statistics',
    },
    {
      id: 'attendance-trends',
      title: 'Attendance Trends',
      description: 'Attendance results for the selected range.',
      chartType: 'line',
      metricId: 'section-attendance-trends',
    },
    {
      id: 'live-class-summary',
      title: 'Live Class Summary',
      description: 'Status summary for live teaching sessions.',
      chartType: 'pie',
      metricId: 'section-live-class-summary',
    },
    {
      id: 'certificates-issued',
      title: 'Certificates Issued',
      description: 'Certificate issuance volume.',
      chartType: 'bar',
      metricId: 'section-certificates-issued',
    },
    {
      id: 'upcoming-activities',
      title: 'Upcoming Activities',
      description: 'Upcoming teaching workload.',
      chartType: 'line',
      metricId: 'section-upcoming-activities',
    },
  ];
  const metricById = new Map(sectionMetrics.map((item) => [item.id, item]));
  const sections = sectionDefinitions.map((section) => ({
    ...section,
    chartTypeLabel: teacherAnalyticsChartTypeLabel[section.chartType],
    courseId: metricById.get(section.metricId)?.courseId ?? null,
  }));

  return {
    timeRange,
    courses,
    kpis,
    sections,
    metrics: [...kpis, ...sectionMetrics],
  };
}

export function getTeacherAnalyticsMetricById(
  metrics: TeacherAnalyticsMetricDto[],
  id: string,
): TeacherAnalyticsMetricDto | null {
  return metrics.find((item) => item.id === id) ?? null;
}

export function getTeacherAnalyticsCourseById(
  courses: TeacherAnalyticsCourseRefDto[],
  id: string | null,
): TeacherAnalyticsCourseRefDto | null {
  return id === null ? null : (courses.find((course) => course.id === id) ?? null);
}

export function filterTeacherAnalyticsSections(
  sections: TeacherAnalyticsSectionDto[],
  courses: TeacherAnalyticsCourseRefDto[],
  query: string,
): TeacherAnalyticsSectionDto[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return sections;
  }
  return sections.filter((section) => {
    const course = getTeacherAnalyticsCourseById(courses, section.courseId);
    return (
      section.title.toLowerCase().includes(normalized) ||
      course?.title.toLowerCase().includes(normalized) === true ||
      course?.slug.toLowerCase().includes(normalized) === true
    );
  });
}

export function filterTeacherAnalyticsKpis(
  kpis: TeacherAnalyticsMetricDto[],
  _query: string,
): TeacherAnalyticsMetricDto[] {
  return kpis;
}

export function isTeacherAnalyticsTimeRange(value: string): value is TeacherAnalyticsTimeRange {
  return teacherAnalyticsTimeRangeOptions.some((option) => option.value === value);
}
