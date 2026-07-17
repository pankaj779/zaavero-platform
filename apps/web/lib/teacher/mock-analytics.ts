/**
 * Teacher Analytics DTOs — shaped like future GET /teachers/me/analytics responses.
 * Read-only overview of teaching effectiveness. Values are explicit placeholders
 * (never fabricated cohort percentages). Graphology appears as one sample course
 * only. Chart types are declared so UI placeholders can later host real series.
 */

export type TeacherAnalyticsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherAnalyticsTimeRange = '7d' | '30d' | '90d' | '1y';
export type TeacherAnalyticsChartType = 'line' | 'bar' | 'pie' | 'area';
export type TeacherAnalyticsMetricKind = 'kpi' | 'section';

export interface TeacherAnalyticsCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

/** Selectable metric for the details panel — KPI or section. */
export interface TeacherAnalyticsMetricDto {
  id: string;
  kind: TeacherAnalyticsMetricKind;
  label: string;
  /** Placeholder display value — never a fabricated live cohort figure. */
  value: string;
  helper: string;
  description: string;
  calculationSource: string;
  futureApi: string;
  notes: string;
  /** Null for org-wide / multi-course overview metrics. */
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

export const teacherAnalyticsViewState: TeacherAnalyticsViewState = 'populated';

export const teacherAnalyticsPageCopy = {
  title: 'Analytics',
  description: 'Read-only overview of teaching effectiveness and cohort health.',
  searchPlaceholder: 'Search by course',
  searchLabel: 'Search analytics by course',
  timeRangeLabel: 'Filter by time range',
  emptyTitle: 'No analytics yet',
  emptyDescription:
    'Analytics appear once courses and batches have activity. Aggregates arrive in a later sprint.',
  noMatchesTitle: 'No matching analytics',
  noMatchesDescription: 'Try a different course name or time range.',
  errorTitle: 'Unable to load analytics',
  errorDescription: 'Something went wrong while loading Analytics. Please try again.',
  kpiLabel: 'Key performance indicators',
  sectionsLabel: 'Analytics sections',
  chartPlaceholderNote: 'Chart placeholder — live series arrive with the analytics API.',
  exportButton: 'Export Report',
  downloadPdfButton: 'Download PDF',
  emailReportButton: 'Email Report',
  comparePeriodsButton: 'Compare Periods',
  comingSoonNote: 'Analytics actions are Coming Soon.',
  detailsButton: 'View details',
  detailsPanelLabel: 'Metric details',
  detailsCloseLabel: 'Close metric details',
  descriptionLabel: 'Metric description',
  calculationSourceLabel: 'Calculation source',
  futureApiLabel: 'Future backend / API',
  notesLabel: 'Notes',
  placeholderValue: '—',
  timeRangeNote: 'Time range filters the mock overview surface only until aggregates land.',
} as const;

export const teacherAnalyticsChartTypeLabel: Record<TeacherAnalyticsChartType, string> = {
  line: 'Line Chart',
  bar: 'Bar Chart',
  pie: 'Pie Chart',
  area: 'Area Chart',
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

const placeholder = teacherAnalyticsPageCopy.placeholderValue;

/**
 * Sample course refs — Graphology once; others keep the surface course-agnostic.
 */
export const teacherAnalyticsCourses: TeacherAnalyticsCourseRefDto[] = [
  {
    id: 'tcourse_001',
    slug: 'graphology-foundation',
    title: 'Graphology Foundations',
  },
  {
    id: 'tcourse_002',
    slug: 'sample-advanced-program',
    title: 'Sample Advanced Program',
  },
  {
    id: 'tcourse_003',
    slug: 'sample-skills-workshop',
    title: 'Sample Skills Workshop',
  },
];

const kpiMetrics: TeacherAnalyticsMetricDto[] = [
  {
    id: 'kpi-total-students',
    kind: 'kpi',
    label: 'Total Students',
    value: placeholder,
    helper: 'Placeholder until roster aggregates land.',
    description: 'Count of learners enrolled in courses you teach within the active organization.',
    calculationSource: 'Enrollments scoped to the teacher’s assigned courses and batches.',
    futureApi: 'GET /teachers/me/analytics (kpi.totalStudents)',
    notes: 'Read-only. Distinct student counting across overlapping batches is backend work.',
    courseId: null,
  },
  {
    id: 'kpi-active-courses',
    kind: 'kpi',
    label: 'Active Courses',
    value: placeholder,
    helper: 'Placeholder until course status aggregates land.',
    description: 'Courses you teach that are currently published / active in the org.',
    calculationSource: 'Courses filtered by teacher assignment and active status.',
    futureApi: 'GET /teachers/me/analytics (kpi.activeCourses)',
    notes: 'Does not include archived drafts.',
    courseId: null,
  },
  {
    id: 'kpi-assignment-submission-rate',
    kind: 'kpi',
    label: 'Assignment Submission Rate',
    value: placeholder,
    helper: 'Placeholder — not a live cohort percentage.',
    description: 'Share of expected submissions received across published assignments.',
    calculationSource: 'Assignment submissions ÷ expected enrollments for the selected range.',
    futureApi: 'GET /teachers/me/analytics (kpi.assignmentSubmissionRate)',
    notes: 'Will be backed by aggregate tables, not raw submission scans.',
    courseId: null,
  },
  {
    id: 'kpi-average-attendance',
    kind: 'kpi',
    label: 'Average Attendance',
    value: placeholder,
    helper: 'Placeholder — not a live cohort percentage.',
    description: 'Mean attendance across completed live sessions in the selected range.',
    calculationSource: 'Attendance records joined to live sessions for the teacher’s batches.',
    futureApi: 'GET /teachers/me/analytics (kpi.averageAttendance)',
    notes: 'Late / excused statuses will be modeled in a later schema wave.',
    courseId: null,
  },
  {
    id: 'kpi-course-completion',
    kind: 'kpi',
    label: 'Course Completion',
    value: placeholder,
    helper: 'Placeholder — not a live cohort percentage.',
    description: 'Share of learners who completed course completion criteria.',
    calculationSource: 'Progress / completion events for enrolled students.',
    futureApi: 'GET /teachers/me/analytics (kpi.courseCompletion)',
    notes: 'Completion rules remain course-agnostic configuration.',
    courseId: null,
  },
  {
    id: 'kpi-student-satisfaction',
    kind: 'kpi',
    label: 'Student Satisfaction',
    value: placeholder,
    helper: 'Placeholder — surveys are not integrated yet.',
    description: 'Future satisfaction score from learner feedback surveys.',
    calculationSource: 'Survey responses once feedback collection ships.',
    futureApi: 'GET /teachers/me/analytics (kpi.studentSatisfaction)',
    notes: 'Explicitly a placeholder until feedback APIs exist.',
    courseId: null,
  },
];

const sectionMetrics: TeacherAnalyticsMetricDto[] = [
  {
    id: 'section-course-performance',
    kind: 'section',
    label: 'Course Performance',
    value: placeholder,
    helper: 'Bar chart placeholder for course comparisons.',
    description: 'Comparative performance across courses you teach.',
    calculationSource: 'Per-course completion, grades, and engagement aggregates.',
    futureApi: 'GET /teachers/me/analytics/courses/[courseId]',
    notes: 'Graphology appears only as one sample course in mocks.',
    courseId: 'tcourse_001',
  },
  {
    id: 'section-student-progress',
    kind: 'section',
    label: 'Student Progress',
    value: placeholder,
    helper: 'Area chart placeholder for progress over time.',
    description: 'Learner progress trends across shared enrollments.',
    calculationSource: 'Progress snapshots for students in assigned batches.',
    futureApi: 'GET /teachers/me/analytics (series.studentProgress)',
    notes: 'Privacy: only students in the teacher’s courses.',
    courseId: 'tcourse_002',
  },
  {
    id: 'section-assignment-statistics',
    kind: 'section',
    label: 'Assignment Statistics',
    value: placeholder,
    helper: 'Bar chart placeholder for submission and grading volumes.',
    description: 'Submission, pending, and graded volumes for assignments.',
    calculationSource: 'Assignment and submission aggregates for the selected range.',
    futureApi: 'GET /teachers/me/analytics (series.assignments)',
    notes: 'No grading logic in this module.',
    courseId: 'tcourse_002',
  },
  {
    id: 'section-attendance-trends',
    kind: 'section',
    label: 'Attendance Trends',
    value: placeholder,
    helper: 'Line chart placeholder for attendance over time.',
    description: 'Attendance rate trend across live sessions.',
    calculationSource: 'Attendance joined to live sessions by date.',
    futureApi: 'GET /teachers/me/analytics (series.attendance)',
    notes: 'Complements the Attendance module; does not mark attendance.',
    courseId: 'tcourse_001',
  },
  {
    id: 'section-live-class-summary',
    kind: 'section',
    label: 'Live Class Summary',
    value: placeholder,
    helper: 'Pie chart placeholder for session status mix.',
    description: 'Distribution of scheduled, live, completed, and cancelled sessions.',
    calculationSource: 'Live session status counts for the teacher’s batches.',
    futureApi: 'GET /teachers/me/analytics (series.liveClasses)',
    notes: 'Meeting providers stay opaque until provisioning lands.',
    courseId: 'tcourse_003',
  },
  {
    id: 'section-certificates-issued',
    kind: 'section',
    label: 'Certificates Issued',
    value: placeholder,
    helper: 'Bar chart placeholder for issued certificates.',
    description: 'Certificates issued or recommended for your courses.',
    calculationSource: 'Certificate records scoped to teacher courses.',
    futureApi: 'GET /teachers/me/analytics (series.certificates)',
    notes: 'Issuance may remain Admin-owned; teachers recommend.',
    courseId: 'tcourse_003',
  },
  {
    id: 'section-upcoming-activities',
    kind: 'section',
    label: 'Upcoming Activities',
    value: placeholder,
    helper: 'Line chart placeholder for upcoming workload.',
    description: 'Upcoming live classes, due assignments, and grading queue pressure.',
    calculationSource: 'Upcoming live sessions + assignment due dates + review queue.',
    futureApi: 'GET /teachers/me/analytics (series.upcoming)',
    notes: 'Calendar unification may later share this series.',
    courseId: null,
  },
];

export const teacherAnalyticsMetrics: TeacherAnalyticsMetricDto[] = [
  ...kpiMetrics,
  ...sectionMetrics,
];

export const teacherAnalyticsKpis: TeacherAnalyticsMetricDto[] = kpiMetrics;

export const teacherAnalyticsSections: TeacherAnalyticsSectionDto[] = [
  {
    id: 'course-performance',
    title: 'Course Performance',
    description: 'Compare teaching outcomes across courses.',
    chartType: 'bar',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.bar,
    metricId: 'section-course-performance',
    courseId: 'tcourse_001',
  },
  {
    id: 'student-progress',
    title: 'Student Progress',
    description: 'Track learner progress trends over time.',
    chartType: 'area',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.area,
    metricId: 'section-student-progress',
    courseId: 'tcourse_002',
  },
  {
    id: 'assignment-statistics',
    title: 'Assignment Statistics',
    description: 'Submission and grading volume overview.',
    chartType: 'bar',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.bar,
    metricId: 'section-assignment-statistics',
    courseId: 'tcourse_002',
  },
  {
    id: 'attendance-trends',
    title: 'Attendance Trends',
    description: 'Attendance rate movement across sessions.',
    chartType: 'line',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.line,
    metricId: 'section-attendance-trends',
    courseId: 'tcourse_001',
  },
  {
    id: 'live-class-summary',
    title: 'Live Class Summary',
    description: 'Status mix for live teaching sessions.',
    chartType: 'pie',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.pie,
    metricId: 'section-live-class-summary',
    courseId: 'tcourse_003',
  },
  {
    id: 'certificates-issued',
    title: 'Certificates Issued',
    description: 'Issued and recommended certificates.',
    chartType: 'bar',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.bar,
    metricId: 'section-certificates-issued',
    courseId: 'tcourse_003',
  },
  {
    id: 'upcoming-activities',
    title: 'Upcoming Activities',
    description: 'Upcoming teaching workload signals.',
    chartType: 'line',
    chartTypeLabel: teacherAnalyticsChartTypeLabel.line,
    metricId: 'section-upcoming-activities',
    courseId: null,
  },
];

export const teacherAnalyticsOverview: TeacherAnalyticsOverviewDto = {
  timeRange: '30d',
  courses: teacherAnalyticsCourses,
  kpis: teacherAnalyticsKpis,
  sections: teacherAnalyticsSections,
  metrics: teacherAnalyticsMetrics,
};

export function getTeacherAnalyticsMetricById(
  metrics: TeacherAnalyticsMetricDto[],
  id: string,
): TeacherAnalyticsMetricDto | null {
  return metrics.find((metric) => metric.id === id) ?? null;
}

export function getTeacherAnalyticsCourseById(
  courses: TeacherAnalyticsCourseRefDto[],
  id: string | null,
): TeacherAnalyticsCourseRefDto | null {
  if (id === null) {
    return null;
  }
  return courses.find((course) => course.id === id) ?? null;
}

export function filterTeacherAnalyticsSections(
  sections: TeacherAnalyticsSectionDto[],
  courses: TeacherAnalyticsCourseRefDto[],
  query: string,
): TeacherAnalyticsSectionDto[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return sections;
  }

  return sections.filter((section) => {
    if (section.courseId === null) {
      return section.title.toLowerCase().includes(normalized);
    }
    const course = courses.find((item) => item.id === section.courseId);
    if (!course) {
      return false;
    }
    return (
      course.title.toLowerCase().includes(normalized) ||
      course.slug.toLowerCase().includes(normalized) ||
      section.title.toLowerCase().includes(normalized)
    );
  });
}

export function filterTeacherAnalyticsKpis(
  kpis: TeacherAnalyticsMetricDto[],
  query: string,
): TeacherAnalyticsMetricDto[] {
  // KPIs are org-wide placeholders; course search does not hide them.
  void query;
  return kpis;
}

export function isTeacherAnalyticsTimeRange(
  value: string,
): value is TeacherAnalyticsTimeRange {
  return teacherAnalyticsTimeRangeOptions.some((option) => option.value === value);
}
