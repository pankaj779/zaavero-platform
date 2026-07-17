import { describe, expect, it } from 'vitest';
import { POST_LOGIN_REDIRECT } from '../lib/auth/redirect';
import { brandConfig } from '../lib/brand';
import {
  faqContent,
  footerConfig,
  navigationConfig,
  programsContent,
  studentSuccessContent,
} from '../lib/config';
import {
  DASHBOARD_ROUTES,
  ROUTES,
  TEACHER_ROUTES,
  getCourseDetailsPath,
  getLessonPath,
} from '../lib/constants';
import {
  teacherNavItems,
  teacherPageMeta,
  getTeacherPageMeta,
  teacherStatsPlaceholder,
  teacherDashboardSections,
  teacherDashboardViewState,
  teacherCourses,
  teacherCoursesViewState,
  filterTeacherCourses,
  sortTeacherCourses,
  getTeacherCourseStats,
  teacherBatches,
  teacherBatchesViewState,
  filterTeacherBatches,
  sortTeacherBatches,
  getTeacherBatchStats,
  teacherStudents,
  teacherStudentsViewState,
  filterTeacherStudents,
  sortTeacherStudents,
  getTeacherStudentStats,
  attendanceSessions,
  teacherAttendanceViewState,
  filterAttendanceSessions,
  sortAttendanceSessions,
  getTeacherAttendanceStats,
  getAttendanceSessionById,
  teacherLiveClasses,
  teacherLiveClassesViewState,
  filterTeacherLiveClasses,
  sortTeacherLiveClasses,
  getTeacherLiveClassStats,
  getTeacherLiveClassById,
  teacherAssignments,
  teacherAssignmentsViewState,
  filterTeacherAssignments,
  sortTeacherAssignments,
  getTeacherAssignmentStats,
  getTeacherAssignmentById,
  teacherAnalyticsOverview,
  teacherAnalyticsViewState,
  teacherAnalyticsCourses,
  teacherAnalyticsKpis,
  teacherAnalyticsSections,
  teacherAnalyticsMetrics,
  teacherAnalyticsTimeRangeOptions,
  filterTeacherAnalyticsSections,
  getTeacherAnalyticsMetricById,
  teacherConversations,
  teacherMessagesViewState,
  filterTeacherConversations,
  getTeacherConversationById,
  teacherCalendarEvents,
  teacherCalendarViewState,
  teacherCalendarInitialMonth,
  filterTeacherCalendarEvents,
  getTeacherCalendarEventsForDay,
  getTeacherCalendarEventById,
  buildTeacherCalendarMonth,
  shiftTeacherCalendarMonth,
} from '../lib/teacher';
import {
  dashboardNavItems,
  dashboardPageMeta,
  enrolledCourses,
  filterAssignments,
  filterCertificates,
  filterEnrolledCourses,
  getCourseDetailsById,
  getDefaultLessonId,
  getFeaturedLiveClass,
  getLessonPlayerData,
  getTodaysLiveClass,
  getUpcomingLiveClasses,
  assignments,
  assignmentsViewState,
  certificates,
  certificatesViewState,
  studentProfile,
  profileViewState,
  settingsViewState,
  notifications,
  notificationsViewState,
  filterNotifications,
  sortNotifications,
  learningPageCopy,
  learningStats,
  learningViewState,
  listCourseDetailIds,
  listLessonIdsForCourse,
  liveClasses,
  liveViewState,
  sortAssignments,
  sortCertificates,
  sortEnrolledCourses,
  widgetDemoStates,
} from '../lib/dashboard';

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

describe('sprint 05.01 student dashboard', () => {
  it('uses /dashboard route base and post-login redirect', () => {
    expect(ROUTES.dashboard).toBe('/dashboard');
    expect(POST_LOGIN_REDIRECT).toBe('/dashboard');
    expect(DASHBOARD_ROUTES.learning).toBe('/dashboard/learning');
    expect(DASHBOARD_ROUTES.liveClasses).toBe('/dashboard/live');
    expect(DASHBOARD_ROUTES.settings).toBe('/dashboard/settings');
  });

  it('defines sidebar navigation items in blueprint order', () => {
    expect(dashboardNavItems.map((item) => item.label)).toEqual([
      'Dashboard',
      'My Learning',
      'Live Classes',
      'Assignments',
      'Certificates',
      'Notifications',
      'Calendar',
      'Messages',
      'Payments',
      'Profile',
      'Settings',
    ]);
  });

  it('has page metadata for every dashboard route', () => {
    for (const item of dashboardNavItems) {
      expect(dashboardPageMeta[item.href]?.title).toBeTruthy();
    }
  });

  it('defines widget demo states for loading empty populated support', () => {
    expect(Object.keys(widgetDemoStates)).toEqual(
      expect.arrayContaining([
        'continueLearning',
        'upcomingLiveClass',
        'assignmentsDue',
        'learningProgress',
        'certificatesEarned',
        'recentActivity',
        'quickActions',
      ]),
    );
  });
});

describe('sprint 05.02 my learning', () => {
  it('exposes enrolled courses and honest placeholder stats', () => {
    expect(enrolledCourses.length).toBeGreaterThan(0);
    expect(enrolledCourses.every((course) => course.instructor.name.includes('Placeholder'))).toBe(
      true,
    );
    expect(learningStats.map((stat) => stat.label)).toEqual([
      'Learning Streak',
      'Total Courses',
      'Completed Courses',
      'Hours Learned',
    ]);
  });

  it('filters and sorts enrolled courses without mutating source data', () => {
    const filtered = filterEnrolledCourses(enrolledCourses, 'foundations', 'in_progress');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Graphology Foundations');

    const sorted = sortEnrolledCourses(enrolledCourses, 'alphabetical');
    expect(sorted.map((course) => course.title)).toEqual([
      'Advanced Graphology',
      'Graphology Foundations',
      'Handwriting Improvement',
    ]);
    expect(enrolledCourses[0]?.title).toBe('Graphology Foundations');
  });

  it('defaults My Learning to the populated view state', () => {
    expect(learningViewState).toBe('populated');
    expect(learningPageCopy.title).toBe('My Learning');
  });
});

describe('sprint 05.03 course details', () => {
  it('resolves course details by dynamic courseId for any catalog entry', () => {
    const ids = listCourseDetailIds();
    expect(ids).toContain('graphology-foundation');
    expect(ids.length).toBeGreaterThanOrEqual(3);

    const course = getCourseDetailsById('graphology-foundation');
    expect(course?.title).toBe('Graphology Foundations');
    expect(course?.modules.length).toBeGreaterThan(0);
    expect(course?.resources.length).toBeGreaterThan(0);
    expect(course?.announcements.length).toBeGreaterThan(0);
    expect(course?.progress.percentage).toBeDefined();
    expect(course?.instructor.name).toBeTruthy();
    expect(course?.features).toBeDefined();
  });

  it('builds course details paths for future course ids', () => {
    expect(getCourseDetailsPath('graphology-foundation')).toBe(
      '/dashboard/learning/graphology-foundation',
    );
    expect(getCourseDetailsPath('future-course-slug')).toBe(
      '/dashboard/learning/future-course-slug',
    );
  });

  it('returns null for unknown course ids', () => {
    expect(getCourseDetailsById('unknown-course')).toBeNull();
  });
});

describe('sprint 05.04 lesson player', () => {
  it('resolves lesson player DTO by course slug and lesson id', () => {
    const data = getLessonPlayerData('graphology-foundation', 'introduction');
    expect(data?.course.slug).toBe('graphology-foundation');
    expect(data?.lesson.id).toBe('introduction');
    expect(data?.lesson.type).toBe('VIDEO');
    expect(data?.lesson.content.type).toBe('VIDEO');
    expect(data?.curriculum.length).toBeGreaterThan(0);
    expect(data?.lesson.features).toBeDefined();
  });

  it('covers all placeholder lesson content types', () => {
    const types = listLessonIdsForCourse('graphology-foundation').map(
      (id) => getLessonPlayerData('graphology-foundation', id)?.lesson.type,
    );
    expect(types).toEqual(
      expect.arrayContaining(['VIDEO', 'READING', 'PDF', 'EXERCISE', 'UNKNOWN']),
    );
  });

  it('builds lesson paths for future course and lesson ids', () => {
    expect(getLessonPath('graphology-foundation', 'introduction')).toBe(
      '/dashboard/learning/graphology-foundation/lesson/introduction',
    );
    expect(getLessonPath('future-course', 'future-lesson')).toBe(
      '/dashboard/learning/future-course/lesson/future-lesson',
    );
  });

  it('returns null for unknown lesson ids and exposes a default lesson', () => {
    expect(getLessonPlayerData('graphology-foundation', 'missing-lesson')).toBeNull();
    expect(getDefaultLessonId('graphology-foundation')).toBe('reference-sheet');
  });
});

describe('sprint 05.05 live classes', () => {
  it('exposes DTO-shaped live classes without meeting URLs', () => {
    expect(liveClasses.length).toBeGreaterThan(0);
    expect(liveClasses.every((item) => item.meetingUrl === null)).toBe(true);
    expect(liveClasses.every((item) => item.mentor.name.includes('Placeholder'))).toBe(true);
    expect(liveClasses[0]?.futureFeatures).toBeDefined();
    expect(liveViewState).toBe('populated');
  });

  it('separates today and upcoming sessions', () => {
    const today = getTodaysLiveClass(liveClasses);
    const upcoming = getUpcomingLiveClasses(liveClasses);
    expect(today?.isToday).toBe(true);
    expect(upcoming.every((item) => !item.isToday)).toBe(true);
    expect(getFeaturedLiveClass(liveClasses)?.id).toBeTruthy();
  });

  it('routes live classes under /dashboard/live', () => {
    expect(DASHBOARD_ROUTES.liveClasses).toBe('/dashboard/live');
    expect(dashboardNavItems.find((item) => item.id === 'live-classes')?.href).toBe(
      '/dashboard/live',
    );
  });
});

describe('sprint 05.06 assignments', () => {
  it('exposes DTO-shaped assignments without fake grades or files', () => {
    expect(assignments.length).toBeGreaterThan(0);
    expect(assignments.every((item) => item.obtainedMarks === null)).toBe(true);
    expect(assignments.every((item) => item.feedback.summary === null)).toBe(true);
    expect(assignments.every((item) => item.attachments.every((file) => file.url === null))).toBe(
      true,
    );
    expect(assignments.every((item) => item.mentor.name.includes('Placeholder'))).toBe(true);
    expect(assignments[0]?.futureFeatures).toBeDefined();
    expect(assignmentsViewState).toBe('populated');
  });

  it('filters and sorts assignments without mutating source data', () => {
    const filtered = filterAssignments(assignments, 'baseline', 'in_progress');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toContain('Baseline');

    const sorted = sortAssignments(assignments, 'newest');
    expect(sorted.length).toBe(assignments.length);
    expect(assignments[0]?.id).toBe('assignment_001');
  });

  it('routes assignments under /dashboard/assignments', () => {
    expect(DASHBOARD_ROUTES.assignments).toBe('/dashboard/assignments');
    expect(dashboardNavItems.find((item) => item.id === 'assignments')?.href).toBe(
      '/dashboard/assignments',
    );
  });
});

describe('sprint 05.07 certificates', () => {
  it('exposes DTO-shaped certificates without download or verification URLs', () => {
    expect(certificates.length).toBeGreaterThan(0);
    expect(certificates.every((item) => item.downloadUrl === null)).toBe(true);
    expect(certificates.every((item) => item.verificationUrl === null)).toBe(true);
    expect(certificates.every((item) => item.grade === null)).toBe(true);
    expect(certificates.every((item) => item.percentage === null)).toBe(true);
    expect(certificates.every((item) => item.mentor.name.includes('Placeholder'))).toBe(true);
    expect(certificates[0]?.futureFeatures).toBeDefined();
    expect(certificatesViewState).toBe('populated');
  });

  it('filters and sorts certificates without mutating source data', () => {
    const filtered = filterCertificates(certificates, 'handwriting', 'issued');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.courseTitle).toContain('Handwriting');

    const sorted = sortCertificates(certificates, 'oldest');
    expect(sorted.length).toBe(certificates.length);
    expect(certificates[0]?.id).toBe('cert_001');
  });

  it('routes certificates under /dashboard/certificates', () => {
    expect(DASHBOARD_ROUTES.certificates).toBe('/dashboard/certificates');
    expect(dashboardNavItems.find((item) => item.id === 'certificates')?.href).toBe(
      '/dashboard/certificates',
    );
  });
});

describe('sprint 05.08 profile and settings', () => {
  it('exposes DTO-shaped student profile without avatar URL', () => {
    expect(studentProfile.id).toBe('user_001');
    expect(studentProfile.avatarUrl).toBeNull();
    expect(studentProfile.email).toContain('placeholder');
    expect(studentProfile.organization.name).toContain('Placeholder');
    expect(studentProfile.futureFeatures).toBeDefined();
    expect(studentProfile.connectedAccounts.every((account) => account.externalAccountId === null)).toBe(
      true,
    );
    expect(profileViewState).toBe('populated');
    expect(settingsViewState).toBe('populated');
  });

  it('routes profile and settings under dashboard paths', () => {
    expect(DASHBOARD_ROUTES.profile).toBe('/dashboard/profile');
    expect(DASHBOARD_ROUTES.settings).toBe('/dashboard/settings');
    expect(dashboardNavItems.find((item) => item.id === 'profile')?.href).toBe('/dashboard/profile');
    expect(dashboardNavItems.find((item) => item.id === 'settings')?.href).toBe(
      '/dashboard/settings',
    );
  });
});

describe('sprint 05.09 notifications', () => {
  it('exposes DTO-shaped notifications without action URLs', () => {
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.every((item) => item.actionUrl === null)).toBe(true);
    expect(notifications[0]?.futureFeatures.realtimeEnabled).toBe(false);
    expect(notifications[0]?.futureFeatures.pushEnabled).toBe(false);
    expect(notificationsViewState).toBe('populated');
  });

  it('filters and sorts notifications without mutating source data', () => {
    const filtered = filterNotifications(notifications, 'assignment', 'assignment');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((item) => item.type === 'assignment')).toBe(true);

    const sorted = sortNotifications(notifications, 'oldest');
    expect(sorted.length).toBe(notifications.length);
    expect(notifications[0]?.id).toBe('notif_001');
  });

  it('routes notifications under /dashboard/notifications', () => {
    expect(DASHBOARD_ROUTES.notifications).toBe('/dashboard/notifications');
    expect(dashboardNavItems.find((item) => item.id === 'notifications')?.href).toBe(
      '/dashboard/notifications',
    );
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

  it('keeps dashboard statistics as honest placeholders', () => {
    expect(teacherStatsPlaceholder.length).toBe(4);
    expect(teacherStatsPlaceholder.every((stat) => stat.value === '—')).toBe(true);
    expect(teacherDashboardSections.length).toBe(3);
    expect(teacherDashboardViewState).toBe('populated');
  });
});

describe('sprint 06.02 teacher courses', () => {
  it('exposes generic DTO-shaped courses with counts and no media URLs', () => {
    expect(teacherCourses.length).toBeGreaterThan(1);
    expect(teacherCourses.every((course) => course.media.thumbnailUrl === null)).toBe(true);
    expect(
      teacherCourses.every(
        (course) =>
          typeof course.counts.batches === 'number' &&
          typeof course.counts.students === 'number' &&
          typeof course.counts.lessons === 'number' &&
          typeof course.counts.assignments === 'number',
      ),
    ).toBe(true);
    expect(teacherCoursesViewState).toBe('populated');
  });

  it('keeps course architecture course-agnostic (Graphology only one sample)', () => {
    const graphologyCourses = teacherCourses.filter((course) =>
      course.title.toLowerCase().includes('graphology'),
    );
    expect(graphologyCourses.length).toBe(1);
    expect(teacherCourses.length).toBeGreaterThan(graphologyCourses.length);
  });

  it('derives top stats from the course list', () => {
    const stats = getTeacherCourseStats(teacherCourses);
    expect(stats.map((stat) => stat.id)).toEqual([
      'active-courses',
      'draft-courses',
      'students',
      'batches',
    ]);
    const published = teacherCourses.filter((course) => course.status === 'published').length;
    expect(stats[0]?.value).toBe(String(published));
  });

  it('filters and sorts courses without mutating source data', () => {
    const drafts = filterTeacherCourses(teacherCourses, '', 'draft');
    expect(drafts.every((course) => course.status === 'draft')).toBe(true);

    const searched = filterTeacherCourses(teacherCourses, 'foundations', 'all');
    expect(searched).toHaveLength(1);

    const alphabetical = sortTeacherCourses(teacherCourses, 'alphabetical');
    const titles = alphabetical.map((course) => course.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));

    const updated = sortTeacherCourses(teacherCourses, 'recently_updated');
    expect(new Date(updated[0]?.updatedAt ?? 0).getTime()).toBeGreaterThanOrEqual(
      new Date(updated[1]?.updatedAt ?? 0).getTime(),
    );
    expect(teacherCourses[0]?.id).toBe('tcourse_001');
  });
});

describe('task 06.03 teacher batches', () => {
  it('exposes the independent /teacher/batches route without adding sidebar nav', () => {
    expect(TEACHER_ROUTES.batches).toBe('/teacher/batches');
    expect(teacherNavItems.some((item) => item.href === TEACHER_ROUTES.batches)).toBe(false);
    expect(getTeacherPageMeta(TEACHER_ROUTES.batches).title).toBe('Batches');
  });

  it('exposes DTO-shaped batches with course, mentor, capacity, live class, and progress fields', () => {
    expect(teacherBatches.length).toBeGreaterThan(1);
    expect(
      teacherBatches.every(
        (batch) =>
          batch.course.title.length > 0 &&
          batch.mentor.name.length > 0 &&
          typeof batch.studentsEnrolled === 'number' &&
          typeof batch.capacity === 'number' &&
          typeof batch.progress.percentage === 'number',
      ),
    ).toBe(true);
    expect(teacherBatches.some((batch) => batch.nextLiveClass === null)).toBe(true);
    expect(teacherBatchesViewState).toBe('populated');
  });

  it('keeps batch architecture course-agnostic (Graphology only one sample)', () => {
    const graphologyBatches = teacherBatches.filter(
      (batch) =>
        batch.name.toLowerCase().includes('graphology') ||
        batch.course.title.toLowerCase().includes('graphology'),
    );
    expect(graphologyBatches.length).toBe(1);
    expect(teacherBatches.length).toBeGreaterThan(graphologyBatches.length);
  });

  it('derives top stats from the batch list', () => {
    const stats = getTeacherBatchStats(teacherBatches);
    expect(stats.map((stat) => stat.id)).toEqual([
      'active-batches',
      'upcoming-batches',
      'completed-batches',
      'total-students',
    ]);
    const students = teacherBatches.reduce((sum, batch) => sum + batch.studentsEnrolled, 0);
    expect(stats[3]?.value).toBe(String(students));
  });

  it('filters and sorts batches without mutating source data', () => {
    const active = filterTeacherBatches(teacherBatches, '', 'active');
    expect(active.every((batch) => batch.status === 'active')).toBe(true);

    const searched = filterTeacherBatches(teacherBatches, 'advanced', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (batch) =>
          batch.name.toLowerCase().includes('advanced') ||
          batch.course.title.toLowerCase().includes('advanced') ||
          batch.course.slug.toLowerCase().includes('advanced'),
      ),
    ).toBe(true);

    const alphabetical = sortTeacherBatches(teacherBatches, 'alphabetical');
    const names = alphabetical.map((batch) => batch.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    const byStartDate = sortTeacherBatches(teacherBatches, 'start_date');
    expect(new Date(byStartDate[0]?.startDate ?? 0).getTime()).toBeLessThanOrEqual(
      new Date(byStartDate[1]?.startDate ?? 0).getTime(),
    );
    expect(teacherBatches[0]?.id).toBe('tbatch_001');
  });
});

describe('task 06.04 teacher students', () => {
  it('routes students under /teacher/students', () => {
    expect(TEACHER_ROUTES.students).toBe('/teacher/students');
    expect(teacherNavItems.find((item) => item.id === 'students')?.href).toBe(
      '/teacher/students',
    );
  });

  it('exposes DTO-shaped students with batch, course, progress, and no avatar URLs', () => {
    expect(teacherStudents.length).toBeGreaterThan(1);
    expect(teacherStudents.every((student) => student.avatarUrl === null)).toBe(true);
    expect(
      teacherStudents.every(
        (student) =>
          student.batch.name.length > 0 &&
          student.course.title.length > 0 &&
          typeof student.progress.percentage === 'number' &&
          typeof student.progress.attendancePercent === 'number' &&
          typeof student.progress.assignmentsCompleted === 'number',
      ),
    ).toBe(true);
    expect(teacherStudentsViewState).toBe('populated');
  });

  it('keeps student architecture course-agnostic (Graphology only one enrolled course)', () => {
    const graphologyCourses = new Set(
      teacherStudents
        .filter((student) => student.course.title.toLowerCase().includes('graphology'))
        .map((student) => student.course.id),
    );
    expect(graphologyCourses.size).toBe(1);
    const uniqueCourses = new Set(teacherStudents.map((student) => student.course.id));
    expect(uniqueCourses.size).toBeGreaterThan(graphologyCourses.size);
  });

  it('derives top stats from the student list', () => {
    const stats = getTeacherStudentStats(teacherStudents);
    expect(stats.map((stat) => stat.id)).toEqual([
      'total-students',
      'active-students',
      'at-risk-students',
      'average-progress',
    ]);
    expect(stats[0]?.value).toBe(String(teacherStudents.length));
    const atRisk = teacherStudents.filter((student) => student.isAtRisk).length;
    expect(stats[2]?.value).toBe(String(atRisk));
  });

  it('filters and sorts students without mutating source data', () => {
    const active = filterTeacherStudents(teacherStudents, '', 'active');
    expect(active.every((student) => student.enrollmentStatus === 'active')).toBe(true);

    const searched = filterTeacherStudents(teacherStudents, 'advanced', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (student) =>
          student.fullName.toLowerCase().includes('advanced') ||
          student.email.toLowerCase().includes('advanced') ||
          student.batch.name.toLowerCase().includes('advanced') ||
          student.course.title.toLowerCase().includes('advanced') ||
          student.course.slug.toLowerCase().includes('advanced'),
      ),
    ).toBe(true);

    const byName = sortTeacherStudents(teacherStudents, 'name');
    const names = byName.map((student) => student.fullName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    const byProgress = sortTeacherStudents(teacherStudents, 'progress');
    expect(byProgress[0]?.progress.percentage ?? 0).toBeGreaterThanOrEqual(
      byProgress[1]?.progress.percentage ?? 0,
    );
    expect(teacherStudents[0]?.id).toBe('tstudent_001');
  });
});

describe('task 06.05 teacher attendance', () => {
  it('routes attendance under /teacher/attendance', () => {
    expect(TEACHER_ROUTES.attendance).toBe('/teacher/attendance');
    expect(teacherNavItems.find((item) => item.id === 'attendance')?.href).toBe(
      '/teacher/attendance',
    );
  });

  it('exposes DTO-shaped sessions with course, batch, mentor, counts, and roster', () => {
    expect(attendanceSessions.length).toBeGreaterThan(1);
    expect(
      attendanceSessions.every(
        (session) =>
          session.course.title.length > 0 &&
          session.batch.name.length > 0 &&
          session.mentor.name.length > 0 &&
          typeof session.durationMinutes === 'number' &&
          typeof session.counts.totalStudents === 'number' &&
          Array.isArray(session.records),
      ),
    ).toBe(true);
    // Integration fields stay opaque until calendar/Zoom/Meet land.
    expect(
      attendanceSessions.every(
        (session) => session.meetingProvider === null && session.meetingUrl === null,
      ),
    ).toBe(true);
    expect(teacherAttendanceViewState).toBe('populated');
  });

  it('keeps attendance architecture course-agnostic (Graphology only one sample)', () => {
    const graphologyCourses = new Set(
      attendanceSessions
        .filter((session) => session.course.title.toLowerCase().includes('graphology'))
        .map((session) => session.course.id),
    );
    expect(graphologyCourses.size).toBe(1);
    const uniqueCourses = new Set(attendanceSessions.map((session) => session.course.id));
    expect(uniqueCourses.size).toBeGreaterThan(graphologyCourses.size);
  });

  it('leaves attendance percent unrecorded for scheduled and cancelled sessions', () => {
    expect(
      attendanceSessions
        .filter((session) => session.status !== 'completed')
        .every(
          (session) => session.counts.attendancePercent === null && session.records.length === 0,
        ),
    ).toBe(true);
    expect(
      attendanceSessions
        .filter((session) => session.status === 'completed')
        .every(
          (session) =>
            session.counts.attendancePercent !== null &&
            session.counts.present + session.counts.absent === session.records.length,
        ),
    ).toBe(true);
  });

  it('derives top stats from completed sessions', () => {
    const stats = getTeacherAttendanceStats(attendanceSessions);
    expect(stats.map((stat) => stat.id)).toEqual([
      'sessions-conducted',
      'average-attendance',
      'students-present',
      'students-absent',
    ]);
    const completed = attendanceSessions.filter((session) => session.status === 'completed');
    expect(stats[0]?.value).toBe(String(completed.length));
    const present = completed.reduce((sum, session) => sum + session.counts.present, 0);
    expect(stats[2]?.value).toBe(String(present));
  });

  it('filters, sorts, and resolves sessions without mutating source data', () => {
    const completedOnly = filterAttendanceSessions(attendanceSessions, '', 'completed');
    expect(completedOnly.every((session) => session.status === 'completed')).toBe(true);

    const searched = filterAttendanceSessions(attendanceSessions, 'advanced', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (session) =>
          session.title.toLowerCase().includes('advanced') ||
          session.batch.name.toLowerCase().includes('advanced') ||
          session.course.title.toLowerCase().includes('advanced') ||
          session.course.slug.toLowerCase().includes('advanced'),
      ),
    ).toBe(true);

    const byTitle = sortAttendanceSessions(attendanceSessions, 'alphabetical');
    const titles = byTitle.map((session) => session.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));

    const byDate = sortAttendanceSessions(attendanceSessions, 'session_date');
    expect(new Date(byDate[0]?.sessionDate ?? 0).getTime()).toBeGreaterThanOrEqual(
      new Date(byDate[1]?.sessionDate ?? 0).getTime(),
    );

    expect(getAttendanceSessionById(attendanceSessions, 'tsession_001')?.title).toBeDefined();
    expect(getAttendanceSessionById(attendanceSessions, 'missing')).toBeNull();
    expect(attendanceSessions[0]?.id).toBe('tsession_001');
  });
});

describe('task 06.06 teacher live classes', () => {
  it('routes live classes under /teacher/live', () => {
    expect(TEACHER_ROUTES.liveClasses).toBe('/teacher/live');
    expect(teacherNavItems.find((item) => item.id === 'live-classes')?.href).toBe(
      '/teacher/live',
    );
  });

  it('exposes batch-scoped DTOs with schedule, mentor, meeting, and attendance data', () => {
    expect(teacherLiveClasses.length).toBeGreaterThan(1);
    expect(
      teacherLiveClasses.every(
        (session) =>
          session.course.title.length > 0 &&
          session.batch.name.length > 0 &&
          session.mentor.name.length > 0 &&
          typeof session.durationMinutes === 'number' &&
          typeof session.batch.studentsEnrolled === 'number' &&
          typeof session.attendance.totalStudents === 'number',
      ),
    ).toBe(true);
    expect(teacherLiveClassesViewState).toBe('populated');
  });

  it('uses only supported providers while keeping every meeting URL null', () => {
    const supportedProviders = new Set(['Zoom', 'Google Meet', 'Microsoft Teams']);
    expect(
      teacherLiveClasses.every((session) => supportedProviders.has(session.meeting.provider)),
    ).toBe(true);
    expect(teacherLiveClasses.map((session) => session.meeting.meetingUrl)).toEqual(
      teacherLiveClasses.map(() => null),
    );
    expect(new Set(teacherLiveClasses.map((session) => session.meeting.provider)).size).toBe(3);
  });

  it('keeps live-class architecture course-agnostic', () => {
    const graphologySamples = teacherLiveClasses.filter((session) =>
      session.course.title.toLowerCase().includes('graphology'),
    );
    expect(graphologySamples).toHaveLength(1);
    expect(new Set(teacherLiveClasses.map((session) => session.course.id)).size).toBeGreaterThan(
      1,
    );
  });

  it('derives the required live-class statistics', () => {
    const stats = getTeacherLiveClassStats(teacherLiveClasses);
    expect(stats.map((stat) => stat.id)).toEqual([
      'upcoming-classes',
      'live-now',
      'completed',
      'total-students',
    ]);
    expect(stats[0]?.value).toBe(
      String(teacherLiveClasses.filter((session) => session.status === 'scheduled').length),
    );
    expect(stats[1]?.value).toBe(
      String(teacherLiveClasses.filter((session) => session.status === 'live').length),
    );
  });

  it('filters, sorts, and resolves classes without mutating source data', () => {
    const scheduled = filterTeacherLiveClasses(teacherLiveClasses, '', 'scheduled');
    expect(scheduled.every((session) => session.status === 'scheduled')).toBe(true);

    const searched = filterTeacherLiveClasses(teacherLiveClasses, 'advanced', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (session) =>
          session.title.toLowerCase().includes('advanced') ||
          session.course.title.toLowerCase().includes('advanced') ||
          session.course.slug.toLowerCase().includes('advanced') ||
          session.batch.name.toLowerCase().includes('advanced'),
      ),
    ).toBe(true);

    const alphabetical = sortTeacherLiveClasses(teacherLiveClasses, 'alphabetical');
    const titles = alphabetical.map((session) => session.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));

    const upcoming = sortTeacherLiveClasses(teacherLiveClasses, 'upcoming');
    expect(new Date(upcoming[0]?.startsAt ?? 0).getTime()).toBeLessThanOrEqual(
      new Date(upcoming[1]?.startsAt ?? 0).getTime(),
    );

    expect(getTeacherLiveClassById(teacherLiveClasses, 'live_session_001')?.title).toBeDefined();
    expect(getTeacherLiveClassById(teacherLiveClasses, 'missing')).toBeNull();
    expect(teacherLiveClasses[0]?.id).toBe('live_session_001');
  });
});

describe('task 06.07 teacher assignments', () => {
  it('routes assignments under /teacher/assignments', () => {
    expect(TEACHER_ROUTES.assignments).toBe('/teacher/assignments');
    expect(teacherNavItems.find((item) => item.id === 'assignments')?.href).toBe(
      '/teacher/assignments',
    );
  });

  it('exposes course-scoped DTOs assigned to one or more batches with placeholder files', () => {
    expect(teacherAssignments.length).toBeGreaterThan(1);
    expect(
      teacherAssignments.every(
        (assignment) =>
          assignment.course.title.length > 0 &&
          assignment.batches.length >= 1 &&
          assignment.batches.every((batch) => batch.name.length > 0) &&
          assignment.attachments.length > 0 &&
          typeof assignment.submissions.totalStudents === 'number' &&
          typeof assignment.grading.maxScore === 'number',
      ),
    ).toBe(true);
    // Integrations remain opaque until grading/plagiarism/AI land.
    const integrationValues = new Set(
      teacherAssignments.flatMap((assignment) => [
        assignment.integrations.plagiarismDetection,
        assignment.integrations.aiEvaluation,
        assignment.integrations.rubricGrading,
        assignment.integrations.notifications,
      ]),
    );
    expect([...integrationValues]).toEqual(['coming_soon']);
    expect(teacherAssignmentsViewState).toBe('populated');
  });

  it('keeps assignment architecture course-agnostic (Graphology only one sample)', () => {
    const graphologySamples = teacherAssignments.filter((assignment) =>
      assignment.course.title.toLowerCase().includes('graphology'),
    );
    expect(graphologySamples).toHaveLength(1);
    expect(
      new Set(teacherAssignments.map((assignment) => assignment.course.id)).size,
    ).toBeGreaterThan(1);
  });

  it('leaves submission rate unrecorded for drafts', () => {
    expect(
      teacherAssignments
        .filter((assignment) => assignment.status === 'draft')
        .every((assignment) => assignment.submissions.submissionRate === null),
    ).toBe(true);
  });

  it('derives the required assignment statistics', () => {
    const stats = getTeacherAssignmentStats(teacherAssignments);
    expect(stats.map((stat) => stat.id)).toEqual([
      'active-assignments',
      'pending-reviews',
      'graded',
      'submission-rate',
    ]);
    expect(stats[0]?.value).toBe(
      String(teacherAssignments.filter((assignment) => assignment.status === 'published').length),
    );
    const pending = teacherAssignments.reduce(
      (sum, assignment) => sum + assignment.grading.awaitingReview,
      0,
    );
    expect(stats[1]?.value).toBe(String(pending));
  });

  it('filters, sorts, and resolves assignments without mutating source data', () => {
    const drafts = filterTeacherAssignments(teacherAssignments, '', 'draft');
    expect(drafts.every((assignment) => assignment.status === 'draft')).toBe(true);

    const searched = filterTeacherAssignments(teacherAssignments, 'advanced', 'all');
    expect(searched.length).toBeGreaterThan(0);
    expect(
      searched.every(
        (assignment) =>
          assignment.title.toLowerCase().includes('advanced') ||
          assignment.course.title.toLowerCase().includes('advanced') ||
          assignment.course.slug.toLowerCase().includes('advanced') ||
          assignment.batches.some((batch) => batch.name.toLowerCase().includes('advanced')),
      ),
    ).toBe(true);

    const alphabetical = sortTeacherAssignments(teacherAssignments, 'alphabetical');
    const titles = alphabetical.map((assignment) => assignment.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));

    const byUpdated = sortTeacherAssignments(teacherAssignments, 'recently_updated');
    expect(new Date(byUpdated[0]?.updatedAt ?? 0).getTime()).toBeGreaterThanOrEqual(
      new Date(byUpdated[1]?.updatedAt ?? 0).getTime(),
    );

    const byDue = sortTeacherAssignments(teacherAssignments, 'due_date');
    expect(byDue[byDue.length - 1]?.dueAt).toBeNull();

    expect(getTeacherAssignmentById(teacherAssignments, 'assignment_001')?.title).toBeDefined();
    expect(getTeacherAssignmentById(teacherAssignments, 'missing')).toBeNull();
    expect(teacherAssignments[0]?.id).toBe('assignment_001');
  });
});

describe('task 06.08 teacher analytics', () => {
  it('routes analytics under /teacher/analytics', () => {
    expect(TEACHER_ROUTES.analytics).toBe('/teacher/analytics');
    expect(teacherNavItems.find((item) => item.id === 'analytics')?.href).toBe(
      '/teacher/analytics',
    );
  });

  it('exposes placeholder KPIs and chart-typed sections without fabricated rates', () => {
    expect(teacherAnalyticsKpis).toHaveLength(6);
    expect(teacherAnalyticsKpis.map((kpi) => kpi.label)).toEqual([
      'Total Students',
      'Active Courses',
      'Assignment Submission Rate',
      'Average Attendance',
      'Course Completion',
      'Student Satisfaction',
    ]);
    expect(teacherAnalyticsKpis.every((kpi) => kpi.value === '—')).toBe(true);
    expect(teacherAnalyticsSections).toHaveLength(7);
    expect(
      teacherAnalyticsSections.every(
        (section) =>
          section.chartTypeLabel.length > 0 &&
          ['line', 'bar', 'pie', 'area'].includes(section.chartType),
      ),
    ).toBe(true);
    expect(teacherAnalyticsViewState).toBe('populated');
    expect(teacherAnalyticsOverview.timeRange).toBe('30d');
  });

  it('keeps analytics architecture course-agnostic (Graphology only one sample)', () => {
    const graphologyCourses = teacherAnalyticsCourses.filter((course) =>
      course.title.toLowerCase().includes('graphology'),
    );
    expect(graphologyCourses).toHaveLength(1);
    expect(teacherAnalyticsCourses.length).toBeGreaterThan(1);
  });

  it('exposes the required time-range filter options', () => {
    expect(teacherAnalyticsTimeRangeOptions.map((option) => option.value)).toEqual([
      '7d',
      '30d',
      '90d',
      '1y',
    ]);
  });

  it('filters sections by course and resolves metric details without mutating source data', () => {
    const byAdvanced = filterTeacherAnalyticsSections(
      teacherAnalyticsSections,
      teacherAnalyticsCourses,
      'advanced',
    );
    expect(byAdvanced.length).toBeGreaterThan(0);
    expect(
      byAdvanced.every((section) => {
        if (section.courseId === null) {
          return section.title.toLowerCase().includes('advanced');
        }
        const course = teacherAnalyticsCourses.find((item) => item.id === section.courseId);
        return (
          course?.title.toLowerCase().includes('advanced') === true ||
          course?.slug.toLowerCase().includes('advanced') === true ||
          section.title.toLowerCase().includes('advanced')
        );
      }),
    ).toBe(true);

    expect(getTeacherAnalyticsMetricById(teacherAnalyticsMetrics, 'kpi-total-students')?.label).toBe(
      'Total Students',
    );
    expect(getTeacherAnalyticsMetricById(teacherAnalyticsMetrics, 'missing')).toBeNull();
    expect(teacherAnalyticsSections[0]?.id).toBe('course-performance');
  });
});

describe('task 06.09 teacher messages', () => {
  it('routes messages under /teacher/messages', () => {
    expect(TEACHER_ROUTES.messages).toBe('/teacher/messages');
    expect(teacherNavItems.find((item) => item.id === 'messages')?.href).toBe(
      '/teacher/messages',
    );
  });

  it('exposes DTO-shaped conversations with participants, messages, and future feature flags', () => {
    expect(teacherConversations.length).toBeGreaterThan(1);
    expect(
      teacherConversations.every(
        (conversation) =>
          conversation.title.length > 0 &&
          conversation.participants.length >= 1 &&
          conversation.messages.length >= 1 &&
          conversation.lastMessage.id.length > 0,
      ),
    ).toBe(true);
    const integrationValues = new Set(
      teacherConversations.flatMap((conversation) => [
        conversation.futureFeatures.realtime,
        conversation.futureFeatures.uploads,
        conversation.futureFeatures.notifications,
        conversation.futureFeatures.reactions,
      ]),
    );
    expect([...integrationValues]).toEqual(['coming_soon']);
    expect(teacherMessagesViewState).toBe('populated');
  });

  it('keeps Graphology as only one batch course sample', () => {
    const graphologyCourses = new Set(
      teacherConversations
        .map((conversation) => conversation.courseTitle)
        .filter((title): title is string => title !== null)
        .filter((title) => title.toLowerCase().includes('graphology')),
    );
    expect(graphologyCourses.size).toBe(1);
  });

  it('filters conversations by unread, type, and search without mutating source data', () => {
    const unread = filterTeacherConversations(teacherConversations, '', 'unread');
    expect(unread.every((conversation) => conversation.unreadCount > 0)).toBe(true);

    const students = filterTeacherConversations(teacherConversations, '', 'students');
    expect(students.every((conversation) => conversation.type === 'student')).toBe(true);

    const batches = filterTeacherConversations(teacherConversations, '', 'batches');
    expect(batches.every((conversation) => conversation.type === 'batch')).toBe(true);

    const searched = filterTeacherConversations(teacherConversations, 'advanced', 'all');
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

    expect(getTeacherConversationById(teacherConversations, 'tconv_001')?.title).toBeDefined();
    expect(getTeacherConversationById(teacherConversations, 'missing')).toBeNull();
    expect(teacherConversations[0]?.id).toBe('tconv_001');
  });
});

describe('task 06.10 teacher calendar', () => {
  it('routes calendar under /teacher/calendar without adding sidebar nav', () => {
    expect(TEACHER_ROUTES.calendar).toBe('/teacher/calendar');
    expect(teacherNavItems.some((item) => item.href === TEACHER_ROUTES.calendar)).toBe(false);
    expect(getTeacherPageMeta(TEACHER_ROUTES.calendar).title).toBe('Calendar');
  });

  it('exposes DTO-shaped events with null meetingUrl/location and coming-soon integrations', () => {
    expect(teacherCalendarEvents.length).toBeGreaterThan(1);
    expect(
      teacherCalendarEvents.every(
        (event) => event.id.length > 0 && event.title.length > 0 && event.mentor.name.length > 0,
      ),
    ).toBe(true);
    expect(teacherCalendarEvents.map((event) => [event.meetingUrl, event.location])).toEqual(
      teacherCalendarEvents.map(() => [null, null]),
    );
    const integrationValues = new Set(
      teacherCalendarEvents.flatMap((event) => [
        event.futureFeatures.googleCalendar,
        event.futureFeatures.outlook,
        event.futureFeatures.meetingProvisioning,
        event.futureFeatures.reminders,
      ]),
    );
    expect([...integrationValues]).toEqual(['coming_soon']);
    expect(teacherCalendarViewState).toBe('populated');
  });

  it('keeps Graphology as only one course sample', () => {
    const graphologyCourses = new Set(
      teacherCalendarEvents
        .map((event) => event.course?.title)
        .filter((title): title is string => title !== undefined)
        .filter((title) => title.toLowerCase().includes('graphology')),
    );
    expect(graphologyCourses.size).toBe(1);
  });

  it('filters events, resolves day agenda, and builds months without mutating source data', () => {
    const live = filterTeacherCalendarEvents(teacherCalendarEvents, '', 'live_classes');
    expect(live.every((event) => event.type === 'live_class')).toBe(true);

    const assignments = filterTeacherCalendarEvents(teacherCalendarEvents, '', 'assignments');
    expect(assignments.every((event) => event.type === 'assignment_due')).toBe(true);

    const searched = filterTeacherCalendarEvents(teacherCalendarEvents, 'office', 'all');
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

    const dayEvents = getTeacherCalendarEventsForDay(teacherCalendarEvents, '2026-07-17');
    expect(dayEvents.some((event) => event.id === 'tcal_003')).toBe(true);

    const month = buildTeacherCalendarMonth(
      teacherCalendarInitialMonth.year,
      teacherCalendarInitialMonth.month,
      teacherCalendarEvents,
    );
    expect(month.label).toContain('2026');
    expect(month.days.length % 7).toBe(0);

    const shifted = shiftTeacherCalendarMonth(2026, 7, 1);
    expect(shifted).toEqual({ year: 2026, month: 8 });

    expect(getTeacherCalendarEventById(teacherCalendarEvents, 'tcal_001')?.title).toBeDefined();
    expect(getTeacherCalendarEventById(teacherCalendarEvents, 'missing')).toBeNull();
    expect(teacherCalendarEvents[0]?.id).toBe('tcal_001');
  });
});
