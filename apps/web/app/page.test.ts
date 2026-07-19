import { describe, expect, it } from 'vitest';
import { brandConfig } from '../lib/brand';
import {
  faqContent,
  footerConfig,
  navigationConfig,
  programsContent,
  studentSuccessContent,
} from '../lib/config';
import { TEACHER_ROUTES } from '../lib/constants';
import {
  teacherNavItems,
  teacherPageMeta,
  getTeacherPageMeta,
  teacherDashboardCopy,
  getTeacherCourseStats,
  toCourseApiStatus,
  toCourseListSort,
  getTeacherBatchStats,
  toBatchApiStatus,
  toBatchListSort,
  getTeacherStudentStats,
  toEnrollmentApiStatus,
  toEnrollmentListSort,
  sortTeacherStudents,
  getTeacherLessonStats,
  toLessonApiContentType,
  toLessonListSort,
  formatTeacherLessonDuration,
  getTeacherLiveClassStats,
  toLiveSessionApiStatus,
  toLiveSessionListSort,
  toLiveSessionApiProvider,
  filterTeacherLiveClasses,
  sortTeacherLiveClasses,
  getTeacherLiveClassById,
  filterAttendanceSessions,
  sortAttendanceSessions,
  getTeacherAttendanceStats,
  toAttendanceListSort,
  toAttendanceApiMarkStatus,
  filterTeacherAssignments,
  sortTeacherAssignments,
  getTeacherAssignmentStats,
  getTeacherAssignmentById,
  toAssignmentListSort,
  toAssignmentApiStatus,
  getTeacherSubmissionStats,
  filterTeacherSubmissions,
  sortTeacherSubmissions,
  getTeacherSubmissionById,
  toSubmissionListSort,
  toSubmissionApiStatus,
  buildTeacherAnalyticsOverview,
  teacherAnalyticsTimeRangeOptions,
  filterTeacherAnalyticsSections,
  getTeacherAnalyticsMetricById,
  type TeacherAnalyticsSourceDto,
  teacherMessageComingSoonFeatures,
  filterTeacherConversations,
  getTeacherConversationById,
  toConversationApiType,
  toConversationListSort,
  filterTeacherCalendarEvents,
  getTeacherCalendarEventsForDay,
  getTeacherCalendarEventById,
  buildTeacherCalendarMonth,
  shiftTeacherCalendarMonth,
  getTeacherCalendarMonthRange,
  toCalendarListSort,
  teacherCalendarComingSoonFeatures,
  filterTeacherCertificates,
  sortTeacherCertificates,
  getTeacherCertificateStats,
  getTeacherCertificateById,
  toCertificateListSort,
  toCertificateApiStatus,
  deriveTeacherCertificateBatches,
  teacherNotificationFutureFeatures,
  getTeacherNotificationStats,
  filterTeacherNotifications,
  sortTeacherNotifications,
  getTeacherNotificationById,
  toNotificationApiType,
  toNotificationApiUnreadOnly,
  toNotificationListSort,
  buildTeacherProfileFromAuth,
  teacherProfileDefaults,
  teacherSettingsViewState,
  getTeacherDisplayName,
  getTeacherLanguageLabel,
  TEACHER_COMING_SOON,
} from '../lib/teacher';

describe('homepage blueprint', () => {
  it('exposes blueprint navigation labels and CTA', () => {
    expect(navigationConfig.primary.map((item) => item.label)).toEqual([
      'Home',
      'Programs',
      'About',
      'Testimonials',
      'FAQ',
      'Contact',
    ]);
    expect(navigationConfig.auth.cta.label).toBe('Start Learning');
  });

  it('defines four program cards including future programs', () => {
    expect(programsContent.cards).toHaveLength(4);
  });

  it('defines ten FAQ questions with placeholder answers', () => {
    expect(faqContent.items).toHaveLength(10);
  });

  it('keeps student success as honest placeholders', () => {
    expect(studentSuccessContent.cards).toHaveLength(3);
    expect(studentSuccessContent.cards[0].nameLabel).toBe('Student Name Placeholder');
  });

  it('exposes four footer columns with version and powered-by', () => {
    expect(footerConfig.columns.map((column) => column.title)).toEqual([
      'Company',
      'Programs',
      'Resources',
      'Legal',
    ]);
    expect(footerConfig.version).toMatch(/^v/);
    expect(brandConfig.company.parentName).toBe('Zaavero');
  });
});

describe('sprint 06.01 teacher portal shell', () => {
  it('uses an independent /teacher route base', () => {
    expect(TEACHER_ROUTES.root).toBe('/teacher');
    expect(TEACHER_ROUTES.dashboard).toBe('/teacher/dashboard');
    expect(TEACHER_ROUTES.liveClasses).toBe('/teacher/live');
    expect(TEACHER_ROUTES.settings).toBe('/teacher/settings');
    expect(TEACHER_ROUTES.dashboard.startsWith('/dashboard')).toBe(false);
  });

  it('defines sidebar navigation items in architecture order', () => {
    expect(teacherNavItems.map((item) => item.label)).toEqual([
      'Dashboard',
      'Courses',
      'Lessons',
      'Live Classes',
      'Assignments',
      'Students',
      'Attendance',
      'Certificates',
      'Announcements',
      'AI Studio',
      'Messages',
      'Analytics',
      'Profile',
      'Settings',
    ]);
  });

  it('has page metadata with title and breadcrumb for every teacher nav route', () => {
    for (const item of teacherNavItems) {
      expect(teacherPageMeta[item.href]?.title).toBeTruthy();
      expect(teacherPageMeta[item.href]?.breadcrumb).toBeTruthy();
    }
    expect(getTeacherPageMeta('/teacher/unknown').title).toBe('Dashboard');
  });

  it('exposes dashboard loading and retry copy for live API states', () => {
    expect(teacherDashboardCopy.loadingLabel).toContain('Loading');
    expect(teacherDashboardCopy.retryButton).toBe('Retry');
  });
});

describe('sprint 06.02 / task 08.01 teacher courses', () => {
  it('derives top stats from mapped teacher course DTOs', () => {
    const courses = [
      {
        id: 'c1',
        slug: 'published-course',
        title: 'Published Course',
        description: '',
        status: 'published' as const,
        isPublished: true,
        media: { thumbnailUrl: null, thumbnailAlt: 'Course thumbnail placeholder' },
        counts: { batches: 2, students: 10, lessons: 5, assignments: 1 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'c2',
        slug: 'draft-course',
        title: 'Draft Course',
        description: '',
        status: 'draft' as const,
        isPublished: false,
        media: { thumbnailUrl: null, thumbnailAlt: 'Course thumbnail placeholder' },
        counts: { batches: 0, students: 0, lessons: 0, assignments: 0 },
        createdAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    ];

    const stats = getTeacherCourseStats(courses);
    expect(stats.map((stat) => stat.id)).toEqual([
      'active-courses',
      'draft-courses',
      'students',
      'batches',
    ]);
    expect(stats[0]?.value).toBe('1');
    expect(stats[1]?.value).toBe('1');
    expect(stats[2]?.value).toBe('10');
    expect(stats[3]?.value).toBe('2');
  });

  it('maps UI filters and sort options to NestJS list query params', () => {
    expect(toCourseApiStatus('all')).toBeUndefined();
    expect(toCourseApiStatus('published')).toBe('PUBLISHED');
    expect(toCourseListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });
  });
});

describe('task 06.03 / task 08.02 teacher batches', () => {
  it('exposes the independent /teacher/batches route without adding sidebar nav', () => {
    expect(TEACHER_ROUTES.batches).toBe('/teacher/batches');
    expect(teacherNavItems.some((item) => item.href === TEACHER_ROUTES.batches)).toBe(false);
    expect(getTeacherPageMeta(TEACHER_ROUTES.batches).title).toBe('Batches');
  });

  it('derives top stats from mapped teacher batch DTOs', () => {
    const batches = [
      {
        id: 'b1',
        name: 'Active Cohort',
        course: { id: 'c1', slug: 'course-a', title: 'Course A' },
        status: 'active' as const,
        mentor: { id: 't1', name: 'Teacher' },
        studentsEnrolled: 10,
        capacity: 20,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-03-01T00:00:00.000Z',
        nextLiveClass: null,
        progress: { completedLessons: 0, totalLessons: 0, percentage: 0 },
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'b2',
        name: 'Upcoming Cohort',
        course: { id: 'c2', slug: 'course-b', title: 'Course B' },
        status: 'upcoming' as const,
        mentor: { id: 't1', name: 'Teacher' },
        studentsEnrolled: 5,
        capacity: 15,
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '',
        nextLiveClass: null,
        progress: { completedLessons: 0, totalLessons: 0, percentage: 0 },
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'b3',
        name: 'Completed Cohort',
        course: { id: 'c3', slug: 'course-c', title: 'Course C' },
        status: 'completed' as const,
        mentor: { id: 't1', name: 'Teacher' },
        studentsEnrolled: 8,
        capacity: 8,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-06-01T00:00:00.000Z',
        nextLiveClass: null,
        progress: { completedLessons: 0, totalLessons: 0, percentage: 0 },
        updatedAt: '2025-06-02T00:00:00.000Z',
      },
    ];

    const stats = getTeacherBatchStats(batches);
    expect(stats.map((stat) => stat.id)).toEqual([
      'active-batches',
      'upcoming-batches',
      'completed-batches',
      'total-students',
    ]);
    expect(stats[0]?.value).toBe('1');
    expect(stats[1]?.value).toBe('1');
    expect(stats[2]?.value).toBe('1');
    expect(stats[3]?.value).toBe('23');
  });

  it('maps UI filters and sort options to NestJS list query params', () => {
    expect(toBatchApiStatus('all')).toBeUndefined();
    expect(toBatchApiStatus('active')).toBe('ACTIVE');
    expect(toBatchApiStatus('archived')).toBe('CANCELLED');
    expect(toBatchListSort('alphabetical')).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(toBatchListSort('start_date')).toEqual({
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
  });
});

describe('task 06.04 / task 08.03 teacher students', () => {
  it('routes students under /teacher/students', () => {
    expect(TEACHER_ROUTES.students).toBe('/teacher/students');
    expect(teacherNavItems.find((item) => item.id === 'students')?.href).toBe('/teacher/students');
  });

  it('derives top stats from mapped teacher student DTOs', () => {
    const students = [
      {
        id: 'e1',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        avatarUrl: null,
        initials: 'AL',
        batch: { id: 'b1', name: 'Batch A' },
        course: { id: 'c1', slug: 'course-a', title: 'Course A' },
        enrollmentStatus: 'active' as const,
        isAtRisk: true,
        progress: {
          percentage: 40,
          assignmentsCompleted: 1,
          assignmentsTotal: 4,
          attendancePercent: 80,
        },
        joinedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'e2',
        fullName: 'Grace Hopper',
        email: 'grace@example.com',
        avatarUrl: null,
        initials: 'GH',
        batch: { id: 'b2', name: 'Batch B' },
        course: { id: 'c2', slug: 'course-b', title: 'Course B' },
        enrollmentStatus: 'completed' as const,
        isAtRisk: false,
        progress: {
          percentage: 100,
          assignmentsCompleted: 2,
          assignmentsTotal: 2,
          attendancePercent: 100,
        },
        joinedAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-02T00:00:00.000Z',
      },
    ];

    const stats = getTeacherStudentStats(students);
    expect(stats.map((stat) => stat.id)).toEqual([
      'total-students',
      'active-students',
      'at-risk-students',
      'average-progress',
    ]);
    expect(stats[0]?.value).toBe('2');
    expect(stats[1]?.value).toBe('1');
    expect(stats[2]?.value).toBe('1');
    expect(stats[3]?.value).toBe('70%');
  });

  it('maps UI filters and sort options to NestJS enrollment list query params', () => {
    expect(toEnrollmentApiStatus('all')).toBeUndefined();
    expect(toEnrollmentApiStatus('active')).toBe('ACTIVE');
    expect(toEnrollmentApiStatus('inactive')).toBe('DROPPED');
    expect(toEnrollmentListSort('recently_joined')).toEqual({
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
    });

    const students = [
      {
        id: 'e1',
        fullName: 'Zoe',
        email: '',
        avatarUrl: null,
        initials: 'ZO',
        batch: { id: 'b1', name: 'Batch' },
        course: { id: 'c1', slug: 'c', title: 'Course' },
        enrollmentStatus: 'active' as const,
        isAtRisk: false,
        progress: {
          percentage: 10,
          assignmentsCompleted: 0,
          assignmentsTotal: 0,
          attendancePercent: 0,
        },
        joinedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'e2',
        fullName: 'Amy',
        email: '',
        avatarUrl: null,
        initials: 'AM',
        batch: { id: 'b1', name: 'Batch' },
        course: { id: 'c1', slug: 'c', title: 'Course' },
        enrollmentStatus: 'active' as const,
        isAtRisk: false,
        progress: {
          percentage: 90,
          assignmentsCompleted: 0,
          assignmentsTotal: 0,
          attendancePercent: 0,
        },
        joinedAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    ];

    expect(sortTeacherStudents(students, 'name').map((s) => s.fullName)).toEqual(['Amy', 'Zoe']);
    expect(sortTeacherStudents(students, 'progress')[0]?.progress.percentage).toBe(90);
  });
});

describe('task 08.04 teacher lessons', () => {
  it('routes lessons under /teacher/lessons', () => {
    expect(TEACHER_ROUTES.lessons).toBe('/teacher/lessons');
    expect(teacherNavItems.find((item) => item.id === 'lessons')?.href).toBe('/teacher/lessons');
    expect(getTeacherPageMeta(TEACHER_ROUTES.lessons).title).toBe('Lessons');
  });

  it('derives top stats from mapped teacher lesson DTOs', () => {
    const lessons = [
      {
        id: 'l1',
        title: 'Video Intro',
        description: '',
        contentType: 'video' as const,
        contentUrl: null,
        durationSeconds: 120,
        displayOrder: 1,
        course: { id: 'c1', slug: 'c', title: 'Course' },
        module: { id: 'm1', name: 'Module' },
        thumbnailUrl: null,
        attachmentCount: 0,
        completionCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'l2',
        title: 'Quiz Check',
        description: '',
        contentType: 'quiz' as const,
        contentUrl: null,
        durationSeconds: null,
        displayOrder: 2,
        course: { id: 'c1', slug: 'c', title: 'Course' },
        module: { id: 'm1', name: 'Module' },
        thumbnailUrl: null,
        attachmentCount: 0,
        completionCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'l3',
        title: 'Reading Pack',
        description: '',
        contentType: 'pdf' as const,
        contentUrl: null,
        durationSeconds: 0,
        displayOrder: 3,
        course: { id: 'c1', slug: 'c', title: 'Course' },
        module: { id: 'm1', name: 'Module' },
        thumbnailUrl: null,
        attachmentCount: 0,
        completionCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    const stats = getTeacherLessonStats(lessons);
    expect(stats.map((stat) => stat.id)).toEqual([
      'total-lessons',
      'video-lessons',
      'quiz-lessons',
      'reading-lessons',
    ]);
    expect(stats[0]?.value).toBe('3');
    expect(stats[1]?.value).toBe('1');
    expect(stats[2]?.value).toBe('1');
    expect(stats[3]?.value).toBe('1');
  });

  it('maps UI filters and formats duration', () => {
    expect(toLessonApiContentType('all')).toBeUndefined();
    expect(toLessonApiContentType('video')).toBe('VIDEO');
    expect(toLessonListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });
    expect(formatTeacherLessonDuration(120)).toBe('2 min');
  });
});

describe('task 06.05 / task 08.06 teacher attendance', () => {
  const sampleSessions = [
    {
      id: 's1',
      title: 'Foundations Live Session',
      course: { id: 'c1', slug: 'foundations', title: 'Foundations' },
      batch: { id: 'b1', name: 'Weekend Cohort' },
      mentor: { id: 't1', name: 'Teacher' },
      status: 'completed' as const,
      sessionDate: '2026-07-13T11:00:00.000Z',
      durationMinutes: 60,
      meetingProvider: null,
      meetingUrl: null, hostUrl: null,
      counts: { totalStudents: 2, present: 1, absent: 1, attendancePercent: 50 },
      records: [
        {
          studentId: 'st1',
          studentName: 'Student',
          initials: 'ST',
          status: 'present' as const,
        },
        {
          studentId: 'st2',
          studentName: 'Student',
          initials: 'ST',
          status: 'absent' as const,
        },
      ],
      updatedAt: '2026-07-13T12:15:00.000Z',
    },
    {
      id: 's2',
      title: 'Advanced Program Workshop',
      course: { id: 'c2', slug: 'advanced', title: 'Advanced Program' },
      batch: { id: 'b2', name: 'Evening Cohort' },
      mentor: { id: 't1', name: 'Teacher' },
      status: 'scheduled' as const,
      sessionDate: '2026-07-24T15:30:00.000Z',
      durationMinutes: 90,
      meetingProvider: null,
      meetingUrl: null, hostUrl: null,
      counts: { totalStudents: 2, present: 0, absent: 0, attendancePercent: null },
      records: [],
      updatedAt: '2026-07-15T09:00:00.000Z',
    },
  ];

  it('routes attendance under /teacher/attendance', () => {
    expect(TEACHER_ROUTES.attendance).toBe('/teacher/attendance');
    expect(teacherNavItems.find((item) => item.id === 'attendance')?.href).toBe(
      '/teacher/attendance',
    );
  });

  it('derives top stats from completed sessions', () => {
    const stats = getTeacherAttendanceStats(sampleSessions);
    expect(stats.map((stat) => stat.id)).toEqual([
      'sessions-conducted',
      'average-attendance',
      'students-present',
      'students-absent',
    ]);
    expect(stats[0]?.value).toBe('1');
    expect(stats[2]?.value).toBe('1');
    expect(stats[3]?.value).toBe('1');
  });

  it('maps UI filters to NestJS list query params and filters locally', () => {
    expect(toAttendanceApiMarkStatus('all')).toBeUndefined();
    expect(toAttendanceApiMarkStatus('present')).toBe('PRESENT');
    expect(toAttendanceListSort('session_date')).toEqual({
      sortBy: 'markedAt',
      sortOrder: 'desc',
    });

    const completedOnly = filterAttendanceSessions(sampleSessions, '', 'completed');
    expect(completedOnly.every((session) => session.status === 'completed')).toBe(true);

    const searched = filterAttendanceSessions(sampleSessions, 'advanced', 'all');
    expect(searched).toHaveLength(1);
    expect(searched[0]?.title).toContain('Advanced');

    const byCourse = filterAttendanceSessions(sampleSessions, '', 'all', {
      courseId: 'c1',
    });
    expect(byCourse).toHaveLength(1);
    expect(byCourse[0]?.id).toBe('s1');

    const byTitle = sortAttendanceSessions(sampleSessions, 'alphabetical');
    expect(byTitle.map((session) => session.title)).toEqual([
      'Advanced Program Workshop',
      'Foundations Live Session',
    ]);
  });
});

describe('task 06.06 / task 08.05 teacher live classes', () => {
  it('routes live classes under /teacher/live', () => {
    expect(TEACHER_ROUTES.liveClasses).toBe('/teacher/live');
    expect(teacherNavItems.find((item) => item.id === 'live-classes')?.href).toBe('/teacher/live');
  });

  it('derives live-class statistics from mapped DTOs', () => {
    const sessions = [
      {
        id: 's1',
        title: 'Scheduled Session',
        course: { id: 'c1', slug: 'c', title: 'Course' },
        batch: { id: 'b1', name: 'Batch', studentsEnrolled: 10 },
        mentor: { id: 't1', name: 'Teacher' },
        startsAt: '2026-08-01T10:00:00.000Z',
        endsAt: '2026-08-01T11:00:00.000Z',
        durationMinutes: 60,
        status: 'scheduled' as const,
        meeting: { provider: 'Zoom' as const, status: 'ready' as const, meetingUrl: null, hostUrl: null },
        attendance: {
          totalStudents: 10,
          present: 0,
          absent: 0,
          attendancePercent: null,
        },
        integrations: {
          calendar: 'coming_soon' as const,
          notifications: 'coming_soon' as const,
          meetingProvisioning: 'coming_soon' as const,
          recording: 'coming_soon' as const,
        },
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 's2',
        title: 'Live Session',
        course: { id: 'c1', slug: 'c', title: 'Course' },
        batch: { id: 'b1', name: 'Batch', studentsEnrolled: 8 },
        mentor: { id: 't1', name: 'Teacher' },
        startsAt: '2026-07-18T10:00:00.000Z',
        endsAt: '2026-07-18T11:00:00.000Z',
        durationMinutes: 60,
        status: 'live' as const,
        meeting: {
          provider: 'Google Meet' as const,
          status: 'in_progress' as const,
          meetingUrl: null, hostUrl: null,
        },
        attendance: {
          totalStudents: 8,
          present: 0,
          absent: 0,
          attendancePercent: null,
        },
        integrations: {
          calendar: 'coming_soon' as const,
          notifications: 'coming_soon' as const,
          meetingProvisioning: 'coming_soon' as const,
          recording: 'coming_soon' as const,
        },
        updatedAt: '2026-07-18T10:05:00.000Z',
      },
    ];

    const stats = getTeacherLiveClassStats(sessions);
    expect(stats.map((stat) => stat.id)).toEqual([
      'upcoming-classes',
      'live-now',
      'completed',
      'total-students',
    ]);
    expect(stats[0]?.value).toBe('1');
    expect(stats[1]?.value).toBe('1');
    expect(stats[3]?.value).toBe('18');
  });

  it('maps UI filters to NestJS list query params and sorts locally', () => {
    expect(toLiveSessionApiStatus('all')).toBeUndefined();
    expect(toLiveSessionApiStatus('live')).toBe('LIVE');
    expect(toLiveSessionApiProvider('Zoom')).toBe('ZOOM');
    expect(toLiveSessionApiProvider('Microsoft Teams')).toBe('CUSTOM');
    expect(toLiveSessionListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });

    const sessions = [
      {
        id: 's1',
        title: 'Zeta',
        course: { id: 'c1', slug: 'c', title: 'Course' },
        batch: { id: 'b1', name: 'Batch', studentsEnrolled: 1 },
        mentor: { id: 't1', name: 'Teacher' },
        startsAt: '2026-08-02T10:00:00.000Z',
        endsAt: '2026-08-02T11:00:00.000Z',
        durationMinutes: 60,
        status: 'scheduled' as const,
        meeting: { provider: 'Zoom' as const, status: 'ready' as const, meetingUrl: null, hostUrl: null },
        attendance: {
          totalStudents: 1,
          present: 0,
          absent: 0,
          attendancePercent: null,
        },
        integrations: {
          calendar: 'coming_soon' as const,
          notifications: 'coming_soon' as const,
          meetingProvisioning: 'coming_soon' as const,
          recording: 'coming_soon' as const,
        },
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 's2',
        title: 'Alpha',
        course: { id: 'c1', slug: 'c', title: 'Course' },
        batch: { id: 'b1', name: 'Batch', studentsEnrolled: 1 },
        mentor: { id: 't1', name: 'Teacher' },
        startsAt: '2026-08-01T10:00:00.000Z',
        endsAt: '2026-08-01T11:00:00.000Z',
        durationMinutes: 60,
        status: 'scheduled' as const,
        meeting: { provider: 'Zoom' as const, status: 'ready' as const, meetingUrl: null, hostUrl: null },
        attendance: {
          totalStudents: 1,
          present: 0,
          absent: 0,
          attendancePercent: null,
        },
        integrations: {
          calendar: 'coming_soon' as const,
          notifications: 'coming_soon' as const,
          meetingProvisioning: 'coming_soon' as const,
          recording: 'coming_soon' as const,
        },
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
    ];

    expect(sortTeacherLiveClasses(sessions, 'alphabetical').map((s) => s.title)).toEqual([
      'Alpha',
      'Zeta',
    ]);
    expect(filterTeacherLiveClasses(sessions, '', 'scheduled')).toHaveLength(2);
    expect(getTeacherLiveClassById(sessions, 's1')?.title).toBe('Zeta');
    expect(getTeacherLiveClassById(sessions, 'missing')).toBeNull();
  });
});

describe('task 06.07 / task 08.09 teacher assignments', () => {
  const sampleAssignments = [
    {
      id: 'a1',
      title: 'Foundations Essay',
      course: { id: 'c1', slug: 'foundations', title: 'Foundations' },
      batches: [{ id: 'b1', name: 'Weekend Cohort', studentsEnrolled: 18 }],
      status: 'published' as const,
      dueAt: '2026-07-24T18:30:00.000Z',
      submissions: {
        totalStudents: 18,
        submitted: 0,
        pending: 18,
        graded: 0,
        submissionRate: 0,
      },
      grading: { graded: 0, awaitingReview: 0, averageScore: null, maxScore: 100 },
      attachments: [{ id: 'att1', label: 'Submission attachment placeholder', kind: 'document' }],
      timeline: [{ id: 'created', label: 'Created', at: '2026-07-10T09:00:00.000Z' }],
      integrations: {
        plagiarismDetection: 'coming_soon' as const,
        aiEvaluation: 'coming_soon' as const,
        rubricGrading: 'coming_soon' as const,
        notifications: 'coming_soon' as const,
      },
      updatedAt: '2026-07-16T11:20:00.000Z',
    },
    {
      id: 'a2',
      title: 'Advanced Case Study',
      course: { id: 'c2', slug: 'advanced', title: 'Advanced Program' },
      batches: [{ id: 'b2', name: 'Evening Cohort', studentsEnrolled: 14 }],
      status: 'draft' as const,
      dueAt: null,
      submissions: {
        totalStudents: 14,
        submitted: 0,
        pending: 14,
        graded: 0,
        submissionRate: null,
      },
      grading: { graded: 0, awaitingReview: 0, averageScore: null, maxScore: 50 },
      attachments: [{ id: 'att1', label: 'Submission attachment placeholder', kind: 'document' }],
      timeline: [{ id: 'created', label: 'Created', at: '2026-07-15T14:00:00.000Z' }],
      integrations: {
        plagiarismDetection: 'coming_soon' as const,
        aiEvaluation: 'coming_soon' as const,
        rubricGrading: 'coming_soon' as const,
        notifications: 'coming_soon' as const,
      },
      updatedAt: '2026-07-15T14:00:00.000Z',
    },
  ];

  it('routes assignments under /teacher/assignments', () => {
    expect(TEACHER_ROUTES.assignments).toBe('/teacher/assignments');
    expect(teacherNavItems.find((item) => item.id === 'assignments')?.href).toBe(
      '/teacher/assignments',
    );
  });

  it('derives assignment statistics from mapped DTOs', () => {
    const stats = getTeacherAssignmentStats(sampleAssignments);
    expect(stats.map((stat) => stat.id)).toEqual([
      'active-assignments',
      'pending-reviews',
      'graded',
      'submission-rate',
    ]);
    expect(stats[0]?.value).toBe('1');
    expect(stats[1]?.value).toBe('0');
    expect(stats[3]?.value).toBe('0%');
  });

  it('maps UI filters to NestJS list query params and sorts locally', () => {
    expect(toAssignmentApiStatus('all')).toBeUndefined();
    expect(toAssignmentApiStatus('published')).toBe('PUBLISHED');
    expect(toAssignmentListSort('due_date')).toEqual({
      sortBy: 'dueAt',
      sortOrder: 'asc',
    });
    expect(toAssignmentListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });

    const drafts = filterTeacherAssignments(sampleAssignments, '', 'draft');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.status).toBe('draft');

    const searched = filterTeacherAssignments(sampleAssignments, 'advanced', 'all');
    expect(searched).toHaveLength(1);

    const alphabetical = sortTeacherAssignments(sampleAssignments, 'alphabetical');
    expect(alphabetical.map((item) => item.title)).toEqual([
      'Advanced Case Study',
      'Foundations Essay',
    ]);

    expect(getTeacherAssignmentById(sampleAssignments, 'a1')?.title).toBe('Foundations Essay');
    expect(getTeacherAssignmentById(sampleAssignments, 'missing')).toBeNull();
  });
});

describe('task 08.10 teacher submissions', () => {
  const sampleSubmissions = [
    {
      id: 'sub1',
      assignment: {
        id: 'a1',
        title: 'Foundations Essay',
        course: { id: 'c1', slug: 'foundations', title: 'Foundations' },
        maxScore: 100,
      },
      student: { id: 'st1', fullName: 'Student', initials: 'ST', avatarUrl: null },
      status: 'submitted' as const,
      content: 'Essay body',
      attachments: [{ id: 'att1', label: 'file.pdf', kind: 'document' }],
      score: null,
      feedback: null,
      submittedAt: '2026-07-20T10:00:00.000Z',
      gradedAt: null,
      grader: null,
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
    {
      id: 'sub2',
      assignment: {
        id: 'a2',
        title: 'Advanced Case Study',
        course: { id: 'c2', slug: 'advanced', title: 'Advanced Program' },
        maxScore: 50,
      },
      student: { id: 'st2', fullName: 'Student', initials: 'ST', avatarUrl: null },
      status: 'graded' as const,
      content: null,
      attachments: [],
      score: 42,
      feedback: 'Good',
      submittedAt: '2026-07-18T10:00:00.000Z',
      gradedAt: '2026-07-19T10:00:00.000Z',
      grader: { id: 't1', name: 'Teacher' },
      updatedAt: '2026-07-19T10:00:00.000Z',
    },
  ];

  it('routes submissions under /teacher/submissions without adding sidebar nav', () => {
    expect(TEACHER_ROUTES.submissions).toBe('/teacher/submissions');
    expect(teacherNavItems.some((item) => item.href === TEACHER_ROUTES.submissions)).toBe(false);
    expect(getTeacherPageMeta(TEACHER_ROUTES.submissions).title).toBe('Submissions');
  });

  it('derives submission statistics from mapped DTOs', () => {
    const stats = getTeacherSubmissionStats(sampleSubmissions);
    expect(stats.map((stat) => stat.id)).toEqual(['awaiting-review', 'graded', 'late', 'returned']);
    expect(stats[0]?.value).toBe('1');
    expect(stats[1]?.value).toBe('1');
  });

  it('maps UI filters to NestJS list query params and sorts locally', () => {
    expect(toSubmissionApiStatus('all')).toBeUndefined();
    expect(toSubmissionApiStatus('graded')).toBe('GRADED');
    expect(toSubmissionListSort('submitted_at')).toEqual({
      sortBy: 'submittedAt',
      sortOrder: 'asc',
    });

    const graded = filterTeacherSubmissions(sampleSubmissions, '', 'graded');
    expect(graded).toHaveLength(1);
    expect(graded[0]?.status).toBe('graded');

    const searched = filterTeacherSubmissions(sampleSubmissions, 'advanced', 'all');
    expect(searched).toHaveLength(1);

    const byScore = sortTeacherSubmissions(sampleSubmissions, 'score');
    expect(byScore[0]?.id).toBe('sub2');

    expect(getTeacherSubmissionById(sampleSubmissions, 'sub1')?.assignment.title).toBe(
      'Foundations Essay',
    );
    expect(getTeacherSubmissionById(sampleSubmissions, 'missing')).toBeNull();
  });
});

describe('task 06.08 teacher analytics', () => {
  const analyticsSource: TeacherAnalyticsSourceDto = {
    courses: [
      {
        id: 'course-1',
        slug: 'foundations',
        title: 'Foundations',
        description: 'Course',
        status: 'published',
        isPublished: true,
        media: { thumbnailUrl: null, thumbnailAlt: 'Foundations' },
        counts: { batches: 1, students: 1, lessons: 1, assignments: 1 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ],
    students: [],
    assignments: [],
    submissions: [],
    attendanceSessions: [],
    liveSessions: [],
    certificates: [],
  };
  const overview = buildTeacherAnalyticsOverview(
    analyticsSource,
    '30d',
    new Date('2026-07-18T00:00:00.000Z'),
  );

  it('routes analytics under /teacher/analytics', () => {
    expect(TEACHER_ROUTES.analytics).toBe('/teacher/analytics');
    expect(teacherNavItems.find((item) => item.id === 'analytics')?.href).toBe(
      '/teacher/analytics',
    );
  });

  it('derives live KPIs and chart-typed sections without fabricating unsupported rates', () => {
    expect(overview.kpis).toHaveLength(6);
    expect(overview.kpis.map((kpi) => kpi.label)).toEqual([
      'Total Students',
      'Active Courses',
      'Assignment Submission Rate',
      'Average Attendance',
      'Course Completion',
      'Student Satisfaction',
    ]);
    expect(overview.kpis.find((kpi) => kpi.id === 'kpi-active-courses')?.value).toBe('1');
    expect(overview.kpis.find((kpi) => kpi.id === 'kpi-student-satisfaction')?.value).toBe('—');
    expect(overview.sections).toHaveLength(7);
    expect(
      overview.sections.every(
        (section) =>
          section.chartTypeLabel.length > 0 &&
          ['line', 'bar', 'pie', 'area'].includes(section.chartType),
      ),
    ).toBe(true);
    expect(overview.timeRange).toBe('30d');
    expect(overview.courses).toEqual([
      { id: 'course-1', slug: 'foundations', title: 'Foundations' },
    ]);
  });

  it('exposes the required time-range filter options', () => {
    expect(teacherAnalyticsTimeRangeOptions.map((option) => option.value)).toEqual([
      '7d',
      '30d',
      '90d',
      '1y',
    ]);
  });

  it('filters sections by live course data and resolves metric details', () => {
    const byFoundations = filterTeacherAnalyticsSections(
      overview.sections,
      overview.courses,
      'foundations',
    );
    expect(byFoundations.length).toBeGreaterThan(0);

    expect(getTeacherAnalyticsMetricById(overview.metrics, 'kpi-total-students')?.label).toBe(
      'Total Students',
    );
    expect(getTeacherAnalyticsMetricById(overview.metrics, 'missing')).toBeNull();
    expect(overview.sections[0]?.id).toBe('course-performance');
  });
});

describe('task 06.09 / task 08.14 teacher messages', () => {
  const teacher = {
    id: 'teacher-1',
    name: 'Teacher',
    role: 'teacher' as const,
    initials: 'T',
  };
  const student = {
    id: 'student-1',
    name: 'Participant',
    role: 'student' as const,
    initials: 'P',
  };
  const firstMessage = {
    id: 'message-1',
    sender: student,
    timestamp: '2026-07-18T09:00:00.000Z',
    body: 'Question about the advanced assignment.',
    attachments: [],
    status: 'delivered' as const,
  };
  const secondMessage = {
    id: 'message-2',
    sender: teacher,
    timestamp: '2026-07-17T09:00:00.000Z',
    body: 'Batch update.',
    attachments: [],
    status: 'sent' as const,
  };
  const sampleConversations = [
    {
      id: 'conversation-1',
      title: 'Advanced assignment question',
      type: 'student' as const,
      unreadCount: 1,
      lastMessage: firstMessage,
      updatedAt: firstMessage.timestamp,
      participants: [teacher, student],
      messages: [firstMessage],
      courseTitle: null,
      futureFeatures: teacherMessageComingSoonFeatures,
    },
    {
      id: 'conversation-2',
      title: 'Weekend cohort',
      type: 'batch' as const,
      unreadCount: 0,
      lastMessage: secondMessage,
      updatedAt: secondMessage.timestamp,
      participants: [teacher, student],
      messages: [secondMessage],
      courseTitle: null,
      futureFeatures: teacherMessageComingSoonFeatures,
    },
  ];

  it('routes messages under /teacher/messages', () => {
    expect(TEACHER_ROUTES.messages).toBe('/teacher/messages');
    expect(teacherNavItems.find((item) => item.id === 'messages')?.href).toBe('/teacher/messages');
  });

  it('exposes mapped DTO conversations with participants and messages', () => {
    expect(
      sampleConversations.every(
        (conversation) =>
          conversation.title.length > 0 &&
          conversation.participants.length >= 1 &&
          conversation.messages.length >= 1 &&
          conversation.lastMessage.id.length > 0,
      ),
    ).toBe(true);
    const integrationValues = new Set(
      sampleConversations.flatMap((conversation) => [
        conversation.futureFeatures.realtime,
        conversation.futureFeatures.uploads,
        conversation.futureFeatures.notifications,
        conversation.futureFeatures.reactions,
      ]),
    );
    expect(integrationValues.has('available')).toBe(true);
    expect(integrationValues.has('coming_soon')).toBe(true);
  });

  it('maps supported filters to API query values', () => {
    expect(toConversationApiType('students')).toBe('DIRECT');
    expect(toConversationApiType('batches')).toBe('BATCH');
    expect(toConversationApiType('announcements')).toBe('SUPPORT');
    expect(toConversationApiType('unread')).toBeUndefined();
    expect(toConversationListSort()).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  });

  it('finishes unread and broad search filtering without mutating source data', () => {
    const unread = filterTeacherConversations(sampleConversations, '', 'unread');
    expect(unread.every((conversation) => conversation.unreadCount > 0)).toBe(true);

    const students = filterTeacherConversations(sampleConversations, '', 'students');
    expect(students.every((conversation) => conversation.type === 'student')).toBe(true);

    const batches = filterTeacherConversations(sampleConversations, '', 'batches');
    expect(batches.every((conversation) => conversation.type === 'batch')).toBe(true);

    const searched = filterTeacherConversations(sampleConversations, 'advanced', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (conversation) =>
          conversation.title.toLowerCase().includes('advanced') ||
          conversation.lastMessage.body.toLowerCase().includes('advanced') ||
          (conversation.courseTitle?.toLowerCase().includes('advanced') ?? false) ||
          conversation.participants.some((participant) =>
            participant.name.toLowerCase().includes('advanced'),
          ),
      ),
    ).toBe(true);

    expect(getTeacherConversationById(sampleConversations, 'conversation-1')?.title).toBeDefined();
    expect(getTeacherConversationById(sampleConversations, 'missing')).toBeNull();
    expect(sampleConversations[0]?.id).toBe('conversation-1');
  });
});

describe('task 06.10 / task 08.12 teacher calendar', () => {
  const sampleEvents = [
    {
      id: 'c1',
      title: 'Foundations Live Session',
      type: 'live_class' as const,
      course: {
        id: 'course1',
        slug: 'graphology-foundation',
        title: 'Graphology Foundations',
      },
      batch: { id: 'b1', name: 'Weekend Cohort' },
      mentor: { id: '', name: 'Teacher' },
      startTime: '2026-07-18T11:00:00.000Z',
      endTime: '2026-07-18T12:00:00.000Z',
      timezone: 'UTC',
      meetingProvider: null,
      meetingUrl: null, hostUrl: null,
      location: null,
      status: 'scheduled' as const,
      description: 'Live class block',
      futureFeatures: teacherCalendarComingSoonFeatures,
    },
    {
      id: 'c2',
      title: 'Advanced Essay due',
      type: 'assignment_due' as const,
      course: {
        id: 'course2',
        slug: 'advanced',
        title: 'Advanced Program',
      },
      batch: { id: 'b2', name: 'Evening Cohort' },
      mentor: { id: '', name: 'Teacher' },
      startTime: '2026-07-20T18:30:00.000Z',
      endTime: '2026-07-20T18:30:00.000Z',
      timezone: 'UTC',
      meetingProvider: null,
      meetingUrl: null, hostUrl: null,
      location: null,
      status: 'scheduled' as const,
      description: 'Assignment due marker',
      futureFeatures: teacherCalendarComingSoonFeatures,
    },
    {
      id: 'c3',
      title: 'Office hours — evening cohort',
      type: 'office_hours' as const,
      course: {
        id: 'course2',
        slug: 'advanced',
        title: 'Advanced Program',
      },
      batch: { id: 'b2', name: 'Evening Cohort' },
      mentor: { id: '', name: 'Teacher' },
      startTime: '2026-07-17T14:00:00.000Z',
      endTime: '2026-07-17T15:00:00.000Z',
      timezone: 'UTC',
      meetingProvider: null,
      meetingUrl: null, hostUrl: null,
      location: null,
      status: 'scheduled' as const,
      description: 'Office hours block',
      futureFeatures: teacherCalendarComingSoonFeatures,
    },
  ];

  it('routes calendar under /teacher/calendar without adding sidebar nav', () => {
    expect(TEACHER_ROUTES.calendar).toBe('/teacher/calendar');
    expect(teacherNavItems.some((item) => item.href === TEACHER_ROUTES.calendar)).toBe(false);
    expect(getTeacherPageMeta(TEACHER_ROUTES.calendar).title).toBe('Calendar');
  });

  it('keeps null meetingUrl/location and coming-soon integrations on mapped DTOs', () => {
    expect(
      sampleEvents.every(
        (event) => event.id.length > 0 && event.title.length > 0 && event.mentor.name.length > 0,
      ),
    ).toBe(true);
    expect(sampleEvents.map((event) => [event.meetingUrl, event.location])).toEqual(
      sampleEvents.map(() => [null, null]),
    );
    const integrationValues = new Set(
      sampleEvents.flatMap((event) => [
        event.futureFeatures.googleCalendar,
        event.futureFeatures.outlook,
        event.futureFeatures.meetingProvisioning,
        event.futureFeatures.reminders,
      ]),
    );
    expect([...integrationValues]).toEqual(['coming_soon']);
  });

  it('maps list sort helpers and month ranges for API queries', () => {
    expect(toCalendarListSort()).toEqual({ sortBy: 'startsAt', sortOrder: 'asc' });
    const range = getTeacherCalendarMonthRange(2026, 7);
    expect(range.from.length).toBeGreaterThan(0);
    expect(range.to.length).toBeGreaterThan(0);
  });

  it('filters events, resolves day agenda, and builds months without mutating source data', () => {
    const live = filterTeacherCalendarEvents(sampleEvents, '', 'live_classes');
    expect(live.every((event) => event.type === 'live_class')).toBe(true);

    const assignments = filterTeacherCalendarEvents(sampleEvents, '', 'assignments');
    expect(assignments.every((event) => event.type === 'assignment_due')).toBe(true);

    const searched = filterTeacherCalendarEvents(sampleEvents, 'office', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (event) =>
          event.title.toLowerCase().includes('office') ||
          event.description.toLowerCase().includes('office') ||
          (event.course?.title.toLowerCase().includes('office') ?? false) ||
          (event.batch?.name.toLowerCase().includes('office') ?? false),
      ),
    ).toBe(true);

    const dayEvents = getTeacherCalendarEventsForDay(sampleEvents, '2026-07-17');
    expect(dayEvents.some((event) => event.id === 'c3')).toBe(true);

    const month = buildTeacherCalendarMonth(2026, 7, sampleEvents, '2026-07-17');
    expect(month.label).toContain('2026');
    expect(month.days.length % 7).toBe(0);

    const shifted = shiftTeacherCalendarMonth(2026, 7, 1);
    expect(shifted).toEqual({ year: 2026, month: 8 });

    expect(getTeacherCalendarEventById(sampleEvents, 'c1')?.title).toBeDefined();
    expect(getTeacherCalendarEventById(sampleEvents, 'missing')).toBeNull();
    expect(sampleEvents[0]?.id).toBe('c1');
  });
});

describe('task 06.11 / task 08.11 teacher certificate management', () => {
  const sampleCertificates = [
    {
      id: 'c1',
      student: { id: 's1', name: 'Student', email: '' },
      course: { id: 'course1', slug: 'foundations', title: 'Foundations' },
      batch: { id: 'b1', name: 'Weekend Cohort' },
      status: 'issued' as const,
      issuedAt: '2026-07-10T09:00:00.000Z',
      certificateNumber: 'CERT-001',
      downloadUrl: null,
      qrImageUrl: null,
      verificationUrl: null,
      mentor: { id: '', name: 'Teacher' },
      futureFeatures: {
        pdfGeneration: 'coming_soon' as const,
        qrGeneration: 'coming_soon' as const,
        blockchainVerification: 'coming_soon' as const,
        emailDelivery: 'coming_soon' as const,
        downloads: 'coming_soon' as const,
      },
      updatedAt: '2026-07-10T09:00:00.000Z',
    },
    {
      id: 'c2',
      student: { id: 's2', name: 'Student', email: '' },
      course: { id: 'course2', slug: 'advanced', title: 'Advanced Program' },
      batch: { id: 'b2', name: 'Evening Cohort' },
      status: 'eligible' as const,
      issuedAt: null,
      certificateNumber: null,
      downloadUrl: null,
      qrImageUrl: null,
      verificationUrl: null,
      mentor: { id: '', name: 'Teacher' },
      futureFeatures: {
        pdfGeneration: 'coming_soon' as const,
        qrGeneration: 'coming_soon' as const,
        blockchainVerification: 'coming_soon' as const,
        emailDelivery: 'coming_soon' as const,
        downloads: 'coming_soon' as const,
      },
      updatedAt: '2026-07-16T10:00:00.000Z',
    },
  ];

  it('routes certificates under /teacher/certificates', () => {
    expect(TEACHER_ROUTES.certificates).toBe('/teacher/certificates');
    expect(teacherNavItems.find((item) => item.id === 'certificates')?.href).toBe(
      '/teacher/certificates',
    );
    expect(getTeacherPageMeta(TEACHER_ROUTES.certificates).title).toBe('Certificates');
  });

  it('derives certificate statistics and batch rollups from mapped DTOs', () => {
    const stats = getTeacherCertificateStats(sampleCertificates);
    expect(stats.map((stat) => stat.id)).toEqual(['eligible', 'pending', 'issued', 'revoked']);
    expect(stats[0]?.value).toBe('1');
    expect(stats[2]?.value).toBe('1');

    const batches = deriveTeacherCertificateBatches(sampleCertificates);
    expect(batches).toHaveLength(2);
    expect(batches.find((batch) => batch.id === 'b1')?.issuedCount).toBe(1);
  });

  it('maps UI filters to NestJS list query params and sorts locally', () => {
    expect(toCertificateApiStatus('all')).toBeUndefined();
    expect(toCertificateApiStatus('issued')).toBe('ISSUED');
    expect(toCertificateListSort('newest')).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    const eligible = filterTeacherCertificates(sampleCertificates, '', 'eligible');
    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.status).toBe('eligible');

    const searched = filterTeacherCertificates(sampleCertificates, 'advanced', 'all');
    expect(searched).toHaveLength(1);

    const byCourse = sortTeacherCertificates(sampleCertificates, 'course');
    expect(byCourse.map((item) => item.course.title)).toEqual(['Advanced Program', 'Foundations']);

    expect(getTeacherCertificateById(sampleCertificates, 'c1')?.certificateNumber).toBe('CERT-001');
    expect(getTeacherCertificateById(sampleCertificates, 'missing')).toBeNull();
  });
});

describe('task 08.13 teacher notifications', () => {
  const sampleNotifications = [
    {
      id: 'n1',
      userId: 'teacher-1',
      title: 'Submission received',
      message: 'A learner submitted an assignment.',
      type: 'assignment' as const,
      priority: 'medium' as const,
      createdAt: '2026-07-18T08:00:00.000Z',
      readAt: null,
      archivedAt: null,
      actionLabel: null,
      actionUrl: null,
      icon: 'clipboard' as const,
      relatedFeatureLabel: 'Assignment',
      futureFeatures: teacherNotificationFutureFeatures,
    },
    {
      id: 'n2',
      userId: 'teacher-1',
      title: 'Course announcement',
      message: 'A new announcement was posted.',
      type: 'announcement' as const,
      priority: 'medium' as const,
      createdAt: '2026-07-17T08:00:00.000Z',
      readAt: '2026-07-17T09:00:00.000Z',
      archivedAt: null,
      actionLabel: null,
      actionUrl: null,
      icon: 'bell' as const,
      relatedFeatureLabel: 'Announcement',
      futureFeatures: teacherNotificationFutureFeatures,
    },
  ];

  it('routes notifications under /teacher without adding sidebar navigation', () => {
    expect(TEACHER_ROUTES.notifications).toBe('/teacher/notifications');
    expect(teacherNavItems.some((item) => item.href === TEACHER_ROUTES.notifications)).toBe(false);
    expect(getTeacherPageMeta(TEACHER_ROUTES.notifications).title).toBe('Notifications');
  });

  it('derives notification statistics from mapped list data', () => {
    const stats = getTeacherNotificationStats(
      sampleNotifications,
      new Date('2026-07-18T12:00:00.000Z'),
    );
    expect(stats.map((stat) => stat.id)).toEqual(['unread', 'read', 'today', 'week']);
    expect(stats.find((stat) => stat.id === 'unread')?.value).toBe('1');
    expect(stats.find((stat) => stat.id === 'read')?.value).toBe('1');
    expect(stats.find((stat) => stat.id === 'today')?.value).toBe('1');
    expect(stats.find((stat) => stat.id === 'week')?.value).toBe('2');
  });

  it('maps supported API filters and finishes search/read filtering locally', () => {
    expect(toNotificationApiType('announcement')).toBe('announcement');
    expect(toNotificationApiType('read')).toBeUndefined();
    expect(toNotificationApiUnreadOnly('unread')).toBe(true);
    expect(toNotificationApiUnreadOnly('read')).toBeUndefined();
    expect(toNotificationListSort('oldest')).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    expect(filterTeacherNotifications(sampleNotifications, '', 'read')).toHaveLength(1);
    expect(filterTeacherNotifications(sampleNotifications, 'submission', 'all')[0]?.id).toBe('n1');
    expect(sortTeacherNotifications(sampleNotifications, 'oldest')[0]?.id).toBe('n2');
    expect(getTeacherNotificationById(sampleNotifications, 'n1')?.readAt).toBeNull();
    expect(getTeacherNotificationById(sampleNotifications, 'missing')).toBeNull();
  });
});

describe('task 06.12 teacher profile and settings', () => {
  const teacherProfile = buildTeacherProfileFromAuth({
    id: 'teacher-1',
    email: 'teacher@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    profileImage: 'https://res.cloudinary.com/demo/image/upload/avatar.webp',
  });

  it('routes profile and settings under /teacher', () => {
    expect(TEACHER_ROUTES.profile).toBe('/teacher/profile');
    expect(TEACHER_ROUTES.settings).toBe('/teacher/settings');
    expect(teacherNavItems.find((item) => item.id === 'profile')?.href).toBe('/teacher/profile');
    expect(teacherNavItems.find((item) => item.id === 'settings')?.href).toBe('/teacher/settings');
    expect(getTeacherPageMeta(TEACHER_ROUTES.profile).title).toBe('Profile');
    expect(getTeacherPageMeta(TEACHER_ROUTES.settings).title).toBe('Settings');
  });

  it('maps auth identity into the teacher profile DTO with honest unsupported defaults', () => {
    expect(teacherProfile.id).toBe('teacher-1');
    expect(teacherProfile.firstName).toBe('Ada');
    expect(teacherProfile.email).toBe('teacher@example.com');
    expect(teacherProfile.avatarUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/avatar.webp',
    );
    expect(teacherProfile.specializations).toEqual([]);
    expect(teacherProfileDefaults.preferences.theme).toBe('system');
    expect(teacherProfile.connectedAccounts.map((account) => account.provider)).toEqual([
      'google',
      'microsoft',
      'zoom',
    ]);
    expect(teacherProfile.connectedAccounts.every((account) => !account.connected)).toBe(true);
    expect(teacherProfile.connectedAccounts.map((account) => account.externalAccountId)).toEqual(
      teacherProfile.connectedAccounts.map(() => null),
    );
    expect(teacherProfile.futureFeatures.avatarUpload).toBe('available');
    expect(teacherProfile.futureFeatures.profileEditing).toBe('coming_soon');
    expect(teacherSettingsViewState).toBe('populated');
  });

  it('formats display name and language labels', () => {
    expect(getTeacherDisplayName(teacherProfile)).toBe('Ada Lovelace');
    expect(getTeacherLanguageLabel('en')).toBe('English');
    expect(getTeacherLanguageLabel('hi')).toContain('hi');
  });
});

describe('task 06.13 teacher portal stabilization', () => {
  it('exposes shared coming-soon copy constants', () => {
    expect(TEACHER_COMING_SOON.ariaSuffix).toBe('coming soon');
    expect(TEACHER_COMING_SOON.integrationLabel).toBe('Coming Soon');
    expect(TEACHER_COMING_SOON.note.length).toBeGreaterThan(0);
  });

  it('maps every TEACHER_ROUTES value to page metadata', () => {
    for (const href of Object.values(TEACHER_ROUTES)) {
      const meta = getTeacherPageMeta(href);
      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.breadcrumb.length).toBeGreaterThan(0);
      if (href === TEACHER_ROUTES.root) {
        // Root redirects to dashboard; meta falls back to dashboard copy.
        expect(meta.title).toBe(getTeacherPageMeta(TEACHER_ROUTES.dashboard).title);
        continue;
      }
      expect(teacherPageMeta[href]?.title).toBe(meta.title);
    }
  });

  it('keeps implemented teacher feature routes under /teacher', () => {
    expect(TEACHER_ROUTES.courses).toBe('/teacher/courses');
    expect(TEACHER_ROUTES.batches).toBe('/teacher/batches');
    expect(TEACHER_ROUTES.students).toBe('/teacher/students');
    expect(TEACHER_ROUTES.attendance).toBe('/teacher/attendance');
    expect(TEACHER_ROUTES.liveClasses).toBe('/teacher/live');
    expect(TEACHER_ROUTES.assignments).toBe('/teacher/assignments');
    expect(TEACHER_ROUTES.analytics).toBe('/teacher/analytics');
    expect(TEACHER_ROUTES.messages).toBe('/teacher/messages');
    expect(TEACHER_ROUTES.calendar).toBe('/teacher/calendar');
    expect(TEACHER_ROUTES.certificates).toBe('/teacher/certificates');
    expect(TEACHER_ROUTES.profile).toBe('/teacher/profile');
    expect(TEACHER_ROUTES.settings).toBe('/teacher/settings');
  });
});
