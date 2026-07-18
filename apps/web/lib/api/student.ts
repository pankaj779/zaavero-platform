import { apiFetch } from '../auth/api-client';
import type { AuthSessionUser } from '../auth/auth-types';
import type {
  StudentAssignmentDto,
  StudentAssignmentListResult,
} from '../student/assignment-types';
import type { StudentAttendanceSummaryDto } from '../student/attendance-types';
import type { StudentCourseDetailDto, StudentCourseListResult } from '../student/course-types';
import type { StudentDashboardDto } from '../student/dashboard-types';
import type { StudentLiveClassDto, StudentLiveClassListResult } from '../student/live-types';
import type { StudentLessonPlayerDto } from '../student/player-types';
import type { StudentProfileDto } from '../student/profile-types';
import type {
  StudentLessonProgressDto,
  StudentProgressOverviewDto,
} from '../student/progress-types';
import type { StudentCertificateDto } from '../teacher/certificate-types';
import type { TeacherCalendarEventDto } from '../teacher/calendar-types';
import type { TeacherConversationDto, TeacherMessageDto } from '../teacher/message-types';
import type { TeacherNotificationDto } from '../teacher/notification-types';
import type { AssignmentApiRecord, AssignmentListMeta } from './assignment-mapper';
import type { AttendanceApiRecord, AttendanceListMeta } from './attendance-mapper';
import { BatchApi } from './batch';
import { CalendarApi, type ListCalendarEventsParams } from './calendar';
import { CertificateApi, type ListCertificatesParams } from './certificate';
import { CourseApi } from './course';
import type { EnrollmentApiRecord, EnrollmentListMeta } from './enrollment-mapper';
import type { LessonApiRecord } from './lesson-mapper';
import {
  LessonProgressApi,
  type CreateLessonProgressInput,
  type ListLessonProgressParams,
  type MarkLessonCompleteInput,
  type UpdateLessonProgressInput,
} from './lesson-progress';
import type { LiveSessionApiRecord, LiveSessionListMeta } from './live-session-mapper';
import {
  MessagingApi,
  type CreateConversationInput,
  type CreateMessageInput,
  type ListConversationsParams,
  type ListMessagesParams,
} from './messaging';
import { NotificationApi, type ListNotificationsParams } from './notification';
import type { SubmissionApiRecord } from './submission-mapper';
import {
  SubmissionApi,
  type CreateSubmissionInput,
  type UpdateSubmissionInput,
} from './submission';
import {
  buildStudentProgressOverview,
  mapEnrollmentToStudentCourseCard,
  mapEnrollmentToStudentCourseDetail,
  mapStudentAssignment,
  mapStudentAttendanceStatus,
  mapStudentAttendanceSummary,
  mapStudentDashboard,
  mapStudentLessonPlayer,
  mapStudentLiveClass,
  mapStudentProfile,
  type StudentBatchLookup,
  type StudentCourseLookup,
  type StudentLiveSessionLookup,
} from './student-mapper';

export interface StudentListParams {
  organizationId: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentCoursesParams extends StudentListParams {
  status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
}

export interface StudentLiveClassesParams extends StudentListParams {
  status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  batchId?: string;
}

export interface StudentAssignmentsParams extends StudentListParams {
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  courseId?: string;
  batchId?: string;
}

export interface StudentAttendanceParams {
  organizationId: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  liveSessionId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'markedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface StudentDashboardParams {
  organizationId: string;
  userId: string;
  welcomeName?: string | null;
}

export interface StudentSubmitAssignmentInput {
  organizationId: string;
  assignmentId: string;
  content?: string | null;
  attachments?: string[];
}

interface PaginatedEnrollmentsPayload {
  items: EnrollmentApiRecord[];
  meta: EnrollmentListMeta;
}

interface PaginatedLessonsPayload {
  items: LessonApiRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PaginatedAssignmentsPayload {
  items: AssignmentApiRecord[];
  meta: AssignmentListMeta;
}

interface PaginatedSubmissionsPayload {
  items: SubmissionApiRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PaginatedLiveSessionsPayload {
  items: LiveSessionApiRecord[];
  meta: LiveSessionListMeta;
}

interface PaginatedAttendancesPayload {
  items: AttendanceApiRecord[];
  meta: AttendanceListMeta;
}

function enrollmentQuery(params: StudentCoursesParams): string {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }
  return `?${query.toString()}`;
}

function lessonsQuery(organizationId: string, courseId?: string): string {
  const query = new URLSearchParams();
  query.set('organizationId', organizationId);
  if (courseId) {
    query.set('courseId', courseId);
  }
  query.set('page', '1');
  query.set('limit', '100');
  query.set('sortBy', 'displayOrder');
  query.set('sortOrder', 'asc');
  return `?${query.toString()}`;
}

function assignmentsQuery(params: StudentAssignmentsParams): string {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);
  if (params.courseId) {
    query.set('courseId', params.courseId);
  }
  if (params.batchId) {
    query.set('batchId', params.batchId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }
  return `?${query.toString()}`;
}

function liveSessionsQuery(params: StudentLiveClassesParams): string {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);
  if (params.batchId) {
    query.set('batchId', params.batchId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }
  return `?${query.toString()}`;
}

function attendancesQuery(params: StudentAttendanceParams): string {
  const query = new URLSearchParams();
  query.set('organizationId', params.organizationId);
  if (params.liveSessionId) {
    query.set('liveSessionId', params.liveSessionId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }
  return `?${query.toString()}`;
}

async function loadCourseAndBatchLookups(organizationId: string): Promise<{
  courses: ReadonlyMap<string, StudentCourseLookup>;
  batches: ReadonlyMap<string, StudentBatchLookup>;
  batchCourseIds: ReadonlyMap<string, string>;
}> {
  const [coursesResult, batchesResult] = await Promise.all([
    CourseApi.getCourses({
      organizationId,
      page: 1,
      limit: 100,
      sortBy: 'title',
      sortOrder: 'asc',
    }),
    BatchApi.getBatches({
      organizationId,
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'asc',
      enrichCourses: false,
    }),
  ]);

  const courses = new Map<string, StudentCourseLookup>(
    coursesResult.items.map((course) => [
      course.id,
      {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
      },
    ]),
  );

  const batches = new Map<string, StudentBatchLookup>(
    batchesResult.items.map((batch) => [batch.id, { id: batch.id, name: batch.name }]),
  );
  const batchCourseIds = new Map<string, string>(
    batchesResult.items.map((batch) => [batch.id, batch.course.id]),
  );

  return { courses, batches, batchCourseIds };
}

async function loadLessonsForCourses(
  organizationId: string,
  courseIds: string[],
): Promise<Map<string, LessonApiRecord[]>> {
  const uniqueIds = [...new Set(courseIds.filter(Boolean))];
  const results = await Promise.all(
    uniqueIds.map(async (courseId) => {
      const payload = await apiFetch<PaginatedLessonsPayload>(
        `/lessons${lessonsQuery(organizationId, courseId)}`,
      );
      return [courseId, payload.items] as const;
    }),
  );
  return new Map(results);
}

async function loadAllProgress(organizationId: string): Promise<StudentLessonProgressDto[]> {
  const result = await LessonProgressApi.getLessonProgress({
    organizationId,
    page: 1,
    limit: 100,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  return result.items;
}

function buildLiveSessionLookups(
  sessions: LiveSessionApiRecord[],
  courses: ReadonlyMap<string, StudentCourseLookup>,
  batches: ReadonlyMap<string, StudentBatchLookup>,
  batchCourseIds: ReadonlyMap<string, string>,
): ReadonlyMap<string, StudentLiveSessionLookup> {
  return new Map(
    sessions.map((session) => {
      const courseId = batchCourseIds.get(session.batchId) ?? '';
      const course = courses.get(courseId);
      const batch = batches.get(session.batchId);
      return [
        session.id,
        {
          id: session.id,
          title: session.title,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          courseId,
          courseSlug: course?.slug ?? '',
          courseTitle: course?.title ?? 'Course',
          batchId: session.batchId,
          batchName: batch?.name ?? 'Batch',
        } satisfies StudentLiveSessionLookup,
      ];
    }),
  );
}

/**
 * Student Portal orchestration API.
 * Composes existing domain clients + student-specific raw apiFetch where teacher
 * mappers discard fields students need (meeting URLs, instructions, late/excused).
 */
export const StudentApi = {
  async getDashboard(params: StudentDashboardParams): Promise<StudentDashboardDto> {
    const { organizationId, userId, welcomeName = null } = params;

    const [
      lookups,
      enrollmentsPayload,
      progressItems,
      livePayload,
      assignmentsPayload,
      submissionsPayload,
      attendancePayload,
      notificationsResult,
      calendarResult,
      certificatesResult,
    ] = await Promise.all([
      loadCourseAndBatchLookups(organizationId),
      apiFetch<PaginatedEnrollmentsPayload>(
        `/enrollments?organizationId=${encodeURIComponent(organizationId)}&page=1&limit=20`,
      ),
      loadAllProgress(organizationId),
      apiFetch<PaginatedLiveSessionsPayload>(
        `/live-sessions?organizationId=${encodeURIComponent(organizationId)}&page=1&limit=20&sortBy=startsAt&sortOrder=asc`,
      ),
      apiFetch<PaginatedAssignmentsPayload>(
        `/assignments?organizationId=${encodeURIComponent(organizationId)}&status=PUBLISHED&page=1&limit=20&sortBy=dueAt&sortOrder=asc`,
      ),
      apiFetch<PaginatedSubmissionsPayload>(
        `/submissions?organizationId=${encodeURIComponent(organizationId)}&page=1&limit=100&sortBy=updatedAt&sortOrder=desc`,
      ),
      apiFetch<PaginatedAttendancesPayload>(
        `/attendances?organizationId=${encodeURIComponent(organizationId)}&page=1&limit=100&sortBy=markedAt&sortOrder=desc`,
      ),
      NotificationApi.getNotifications({
        organizationId,
        userId,
        channel: 'IN_APP',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
      CalendarApi.getCalendarEvents({
        organizationId,
        page: 1,
        limit: 10,
        sortBy: 'startsAt',
        sortOrder: 'asc',
      }),
      CertificateApi.getCertificates({
        organizationId,
        page: 1,
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
    ]);

    const lessonsByCourse = await loadLessonsForCourses(
      organizationId,
      enrollmentsPayload.items.map((item) => item.courseId),
    );

    const courses = enrollmentsPayload.items.map((enrollment) =>
      mapEnrollmentToStudentCourseCard(
        enrollment,
        lookups.courses.get(enrollment.courseId),
        lookups.batches.get(enrollment.batchId),
        lessonsByCourse.get(enrollment.courseId) ?? [],
        progressItems,
      ),
    );

    const attendanceBySession = new Map<string, AttendanceApiRecord>();
    for (const record of attendancePayload.items) {
      if (!attendanceBySession.has(record.liveSessionId)) {
        attendanceBySession.set(record.liveSessionId, record);
      }
    }

    const liveClasses = livePayload.items.map((session) => {
      const courseId = lookups.batchCourseIds.get(session.batchId) ?? '';
      const attendance = attendanceBySession.get(session.id);
      return mapStudentLiveClass(
        session,
        lookups.courses.get(courseId),
        lookups.batches.get(session.batchId),
        attendance ? mapStudentAttendanceStatus(attendance.status) : null,
      );
    });

    const submissionByAssignment = new Map<string, SubmissionApiRecord>();
    for (const submission of submissionsPayload.items) {
      if (!submissionByAssignment.has(submission.assignmentId)) {
        submissionByAssignment.set(submission.assignmentId, submission);
      }
    }

    const assignments = assignmentsPayload.items.map((assignment) =>
      mapStudentAssignment(
        assignment,
        lookups.courses.get(assignment.courseId),
        assignment.batchId ? lookups.batches.get(assignment.batchId) : undefined,
        submissionByAssignment.get(assignment.id) ?? null,
      ),
    );

    const sessionLookups = buildLiveSessionLookups(
      livePayload.items,
      lookups.courses,
      lookups.batches,
      lookups.batchCourseIds,
    );
    const attendanceSummary = mapStudentAttendanceSummary(
      attendancePayload.items,
      sessionLookups,
      attendancePayload.meta,
    );

    return mapStudentDashboard({
      welcomeName,
      courses,
      liveClasses,
      assignments,
      notifications: notificationsResult.items,
      calendarEvents: calendarResult.items,
      certificates: certificatesResult.items,
      attendancePercent: attendanceSummary.attendancePercent,
    });
  },

  async getCourses(params: StudentCoursesParams): Promise<StudentCourseListResult> {
    const [enrollmentsPayload, lookups, progressItems] = await Promise.all([
      apiFetch<PaginatedEnrollmentsPayload>(`/enrollments${enrollmentQuery(params)}`),
      loadCourseAndBatchLookups(params.organizationId),
      loadAllProgress(params.organizationId),
    ]);

    const courseIds = enrollmentsPayload.items.map((item) => item.courseId);
    const lessonsByCourse = await loadLessonsForCourses(params.organizationId, courseIds);

    const items = enrollmentsPayload.items.map((enrollment) =>
      mapEnrollmentToStudentCourseCard(
        enrollment,
        lookups.courses.get(enrollment.courseId),
        lookups.batches.get(enrollment.batchId),
        lessonsByCourse.get(enrollment.courseId) ?? [],
        progressItems,
      ),
    );

    return { items, meta: enrollmentsPayload.meta };
  },

  async getCourse(
    organizationId: string,
    courseId: string,
  ): Promise<StudentCourseDetailDto | null> {
    const [enrollmentsPayload, lookups, progressItems, lessonsPayload] = await Promise.all([
      apiFetch<PaginatedEnrollmentsPayload>(
        `/enrollments?organizationId=${encodeURIComponent(organizationId)}&courseId=${encodeURIComponent(courseId)}&page=1&limit=1`,
      ),
      loadCourseAndBatchLookups(organizationId),
      loadAllProgress(organizationId),
      apiFetch<PaginatedLessonsPayload>(`/lessons${lessonsQuery(organizationId, courseId)}`),
    ]);

    const enrollment = enrollmentsPayload.items[0];
    if (!enrollment) {
      return null;
    }

    return mapEnrollmentToStudentCourseDetail(
      enrollment,
      lookups.courses.get(enrollment.courseId),
      lookups.batches.get(enrollment.batchId),
      lessonsPayload.items,
      progressItems,
    );
  },

  async getLessonPlayer(
    organizationId: string,
    courseId: string,
    lessonId: string,
  ): Promise<StudentLessonPlayerDto | null> {
    const [lookups, progressItems, lessonsPayload] = await Promise.all([
      loadCourseAndBatchLookups(organizationId),
      loadAllProgress(organizationId),
      apiFetch<PaginatedLessonsPayload>(`/lessons${lessonsQuery(organizationId, courseId)}`),
    ]);

    const course = lookups.courses.get(courseId);
    if (!course) {
      return null;
    }

    return mapStudentLessonPlayer(course, lessonsPayload.items, progressItems, lessonId);
  },

  async getLiveClasses(params: StudentLiveClassesParams): Promise<StudentLiveClassListResult> {
    const [sessionsPayload, lookups, attendancePayload] = await Promise.all([
      apiFetch<PaginatedLiveSessionsPayload>(`/live-sessions${liveSessionsQuery(params)}`),
      loadCourseAndBatchLookups(params.organizationId),
      apiFetch<PaginatedAttendancesPayload>(
        `/attendances?organizationId=${encodeURIComponent(params.organizationId)}&page=1&limit=100&sortBy=markedAt&sortOrder=desc`,
      ).catch(() => ({
        items: [] as AttendanceApiRecord[],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      })),
    ]);

    const attendanceBySession = new Map<string, AttendanceApiRecord>();
    for (const record of attendancePayload.items) {
      if (!attendanceBySession.has(record.liveSessionId)) {
        attendanceBySession.set(record.liveSessionId, record);
      }
    }

    const items = sessionsPayload.items.map((session) => {
      const courseId = lookups.batchCourseIds.get(session.batchId) ?? '';
      const attendance = attendanceBySession.get(session.id);
      return mapStudentLiveClass(
        session,
        lookups.courses.get(courseId),
        lookups.batches.get(session.batchId),
        attendance ? mapStudentAttendanceStatus(attendance.status) : null,
      );
    });

    return { items, meta: sessionsPayload.meta };
  },

  async getLiveClass(
    organizationId: string,
    liveSessionId: string,
  ): Promise<StudentLiveClassDto | null> {
    const result = await StudentApi.getLiveClasses({
      organizationId,
      page: 1,
      limit: 100,
    });
    return result.items.find((item) => item.id === liveSessionId) ?? null;
  },

  async getAssignments(params: StudentAssignmentsParams): Promise<StudentAssignmentListResult> {
    const [assignmentsPayload, submissionsPayload, lookups] = await Promise.all([
      apiFetch<PaginatedAssignmentsPayload>(`/assignments${assignmentsQuery(params)}`),
      apiFetch<PaginatedSubmissionsPayload>(
        `/submissions?organizationId=${encodeURIComponent(params.organizationId)}&page=1&limit=100&sortBy=updatedAt&sortOrder=desc`,
      ),
      loadCourseAndBatchLookups(params.organizationId),
    ]);

    const submissionByAssignment = new Map<string, SubmissionApiRecord>();
    for (const submission of submissionsPayload.items) {
      if (!submissionByAssignment.has(submission.assignmentId)) {
        submissionByAssignment.set(submission.assignmentId, submission);
      }
    }

    const items = assignmentsPayload.items.map((assignment) =>
      mapStudentAssignment(
        assignment,
        lookups.courses.get(assignment.courseId),
        assignment.batchId ? lookups.batches.get(assignment.batchId) : undefined,
        submissionByAssignment.get(assignment.id) ?? null,
      ),
    );

    return { items, meta: assignmentsPayload.meta };
  },

  async getAssignment(
    organizationId: string,
    assignmentId: string,
  ): Promise<StudentAssignmentDto | null> {
    const [assignment, submissionsPayload, lookups] = await Promise.all([
      apiFetch<AssignmentApiRecord>(`/assignments/${assignmentId}`),
      apiFetch<PaginatedSubmissionsPayload>(
        `/submissions?organizationId=${encodeURIComponent(organizationId)}&assignmentId=${encodeURIComponent(assignmentId)}&page=1&limit=1`,
      ),
      loadCourseAndBatchLookups(organizationId),
    ]);

    return mapStudentAssignment(
      assignment,
      lookups.courses.get(assignment.courseId),
      assignment.batchId ? lookups.batches.get(assignment.batchId) : undefined,
      submissionsPayload.items[0] ?? null,
    );
  },

  async submitAssignment(
    input: StudentSubmitAssignmentInput,
  ): Promise<StudentAssignmentDto | null> {
    const createInput: CreateSubmissionInput = {
      organizationId: input.organizationId,
      assignmentId: input.assignmentId,
      content: input.content,
      attachments: input.attachments,
      status: 'SUBMITTED',
    };
    await SubmissionApi.createSubmission(createInput);
    return StudentApi.getAssignment(input.organizationId, input.assignmentId);
  },

  async updateOwnSubmission(
    organizationId: string,
    assignmentId: string,
    submissionId: string,
    input: UpdateSubmissionInput,
  ): Promise<StudentAssignmentDto | null> {
    await SubmissionApi.updateSubmission(submissionId, input);
    return StudentApi.getAssignment(organizationId, assignmentId);
  },

  async getProgress(organizationId: string): Promise<StudentProgressOverviewDto> {
    const [courses, certificates] = await Promise.all([
      StudentApi.getCourses({ organizationId, page: 1, limit: 100 }),
      CertificateApi.getCertificates({
        organizationId,
        page: 1,
        limit: 100,
        status: 'ISSUED',
      }),
    ]);

    return buildStudentProgressOverview(courses.items, certificates.items.length);
  },

  async getLessonProgress(params: ListLessonProgressParams): Promise<{
    items: StudentLessonProgressDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return LessonProgressApi.getLessonProgress(params);
  },

  async markLessonComplete(input: MarkLessonCompleteInput): Promise<StudentLessonProgressDto> {
    return LessonProgressApi.markLessonComplete(input);
  },

  async createLessonProgress(input: CreateLessonProgressInput): Promise<StudentLessonProgressDto> {
    return LessonProgressApi.createLessonProgress(input);
  },

  async updateLessonProgress(
    id: string,
    input: UpdateLessonProgressInput,
  ): Promise<StudentLessonProgressDto> {
    return LessonProgressApi.updateLessonProgress(id, input);
  },

  async getAttendance(params: StudentAttendanceParams): Promise<StudentAttendanceSummaryDto> {
    const [attendancePayload, livePayload, lookups] = await Promise.all([
      apiFetch<PaginatedAttendancesPayload>(`/attendances${attendancesQuery(params)}`),
      apiFetch<PaginatedLiveSessionsPayload>(
        `/live-sessions?organizationId=${encodeURIComponent(params.organizationId)}&page=1&limit=100&sortBy=startsAt&sortOrder=desc`,
      ),
      loadCourseAndBatchLookups(params.organizationId),
    ]);

    const sessions = buildLiveSessionLookups(
      livePayload.items,
      lookups.courses,
      lookups.batches,
      lookups.batchCourseIds,
    );

    return mapStudentAttendanceSummary(attendancePayload.items, sessions, attendancePayload.meta);
  },

  async getCertificates(params: ListCertificatesParams): Promise<{
    items: StudentCertificateDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const result = await CertificateApi.getCertificates(params);
    return { items: result.items, meta: result.meta };
  },

  async getCertificate(id: string): Promise<StudentCertificateDto> {
    return CertificateApi.getCertificate(id);
  },

  async verifyCertificate(verificationCode: string): Promise<StudentCertificateDto> {
    return CertificateApi.verifyCertificate(verificationCode);
  },

  async getCalendarEvents(params: ListCalendarEventsParams): Promise<{
    items: TeacherCalendarEventDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return CalendarApi.getCalendarEvents(params);
  },

  async getNotifications(params: ListNotificationsParams): Promise<{
    items: TeacherNotificationDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return NotificationApi.getNotifications(params);
  },

  async markNotificationRead(id: string): Promise<TeacherNotificationDto> {
    return NotificationApi.markNotificationRead(id);
  },

  async markAllNotificationsRead(organizationId: string): Promise<{ updatedCount: number }> {
    return NotificationApi.markAllNotificationsRead(organizationId);
  },

  async getConversations(params: ListConversationsParams): Promise<{
    items: TeacherConversationDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return MessagingApi.getConversations(params);
  },

  async getConversation(id: string): Promise<TeacherConversationDto> {
    return MessagingApi.getConversation(id);
  },

  async getMessages(
    conversationId: string,
    params: ListMessagesParams = {},
  ): Promise<{
    items: TeacherMessageDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return MessagingApi.getMessages(conversationId, params);
  },

  async createConversation(input: CreateConversationInput): Promise<TeacherConversationDto> {
    return MessagingApi.createConversation(input);
  },

  async sendMessage(conversationId: string, input: CreateMessageInput): Promise<TeacherMessageDto> {
    return MessagingApi.sendMessage(conversationId, input);
  },

  async getProfile(user: AuthSessionUser, organizationId?: string): Promise<StudentProfileDto> {
    if (!organizationId) {
      return mapStudentProfile(user);
    }

    const [learning, certificates] = await Promise.all([
      StudentApi.getProgress(organizationId),
      CertificateApi.getCertificates({
        organizationId,
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
    ]);

    return mapStudentProfile(user, {
      learning,
      certificates: certificates.items,
    });
  },
};
