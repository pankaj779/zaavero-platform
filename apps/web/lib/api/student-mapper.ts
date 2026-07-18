import type { AuthSessionUser } from '../auth/auth-types';
import type { StudentAssignmentDto, StudentOwnSubmissionDto } from '../student/assignment-types';
import type {
  StudentAttendanceMarkStatus,
  StudentAttendanceRecordDto,
  StudentAttendanceSummaryDto,
} from '../student/attendance-types';
import type {
  StudentCourseCardDto,
  StudentCourseDetailDto,
  StudentCourseLessonDto,
  StudentCourseModuleDto,
  StudentCourseLearningStatus,
  StudentEnrollmentStatus,
} from '../student/course-types';
import type {
  StudentDashboardDto,
  StudentDashboardSectionDto,
  StudentDashboardStatDto,
} from '../student/dashboard-types';
import type { StudentLiveClassDto } from '../student/live-types';
import type { StudentLessonPlayerDto } from '../student/player-types';
import type { StudentProfileDto } from '../student/profile-types';
import type {
  StudentLessonProgressDto,
  StudentProgressOverviewDto,
} from '../student/progress-types';
import type { StudentCertificateDto } from '../teacher/certificate-types';
import type { TeacherCalendarEventDto } from '../teacher/calendar-types';
import type { TeacherLessonContentType } from '../teacher/lesson-types';
import type {
  TeacherLiveClassStatus,
  TeacherMeetingProvider,
  TeacherMeetingStatus,
} from '../teacher/live-session-types';
import type { TeacherNotificationDto } from '../teacher/notification-types';
import type { TeacherAssignmentStatus } from '../teacher/assignment-types';
import type { TeacherSubmissionStatus } from '../teacher/submission-types';
import type { AssignmentApiRecord } from './assignment-mapper';
import type { AttendanceApiRecord } from './attendance-mapper';
import type { EnrollmentApiRecord } from './enrollment-mapper';
import type { LessonApiRecord } from './lesson-mapper';
import type { LiveSessionApiRecord } from './live-session-mapper';
import type { SubmissionApiRecord } from './submission-mapper';
import type { CourseApiRecord } from './course-mapper';

export interface StudentCourseLookup {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface StudentBatchLookup {
  id: string;
  name: string;
}

export interface StudentLiveSessionLookup {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  batchId: string;
  batchName: string;
}

function mapEnrollmentStatus(status: string): StudentEnrollmentStatus {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    case 'DROPPED':
    case 'SUSPENDED':
    default:
      return 'inactive';
  }
}

function mapAssignmentStatus(status: string): TeacherAssignmentStatus {
  switch (status.toUpperCase()) {
    case 'PUBLISHED':
      return 'published';
    case 'CLOSED':
      return 'closed';
    case 'ARCHIVED':
      return 'archived';
    case 'DRAFT':
    default:
      return 'draft';
  }
}

function mapSubmissionStatus(status: string): TeacherSubmissionStatus {
  switch (status.toUpperCase()) {
    case 'SUBMITTED':
      return 'submitted';
    case 'GRADED':
      return 'graded';
    case 'RETURNED':
      return 'returned';
    case 'LATE':
      return 'late';
    case 'PENDING':
    default:
      return 'pending';
  }
}

export function mapStudentAttendanceStatus(status: string): StudentAttendanceMarkStatus {
  switch (status.toUpperCase()) {
    case 'PRESENT':
      return 'present';
    case 'LATE':
      return 'late';
    case 'EXCUSED':
      return 'excused';
    case 'ABSENT':
    default:
      return 'absent';
  }
}

function mapLiveStatus(status: string): TeacherLiveClassStatus {
  switch (status.toUpperCase()) {
    case 'LIVE':
      return 'live';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'SCHEDULED':
    default:
      return 'scheduled';
  }
}

function mapMeetingProvider(provider: string): TeacherMeetingProvider {
  switch (provider.toUpperCase()) {
    case 'GOOGLE_MEET':
      return 'Google Meet';
    case 'CUSTOM':
      return 'Microsoft Teams';
    case 'ZOOM':
    case 'NONE':
    default:
      return 'Zoom';
  }
}

function mapMeetingStatus(
  status: TeacherLiveClassStatus,
  providerRaw: string,
): TeacherMeetingStatus {
  if (status === 'cancelled') {
    return 'cancelled';
  }
  if (status === 'live') {
    return 'in_progress';
  }
  if (status === 'completed') {
    return 'ended';
  }
  if (providerRaw.toUpperCase() === 'NONE') {
    return 'setup_pending';
  }
  return 'ready';
}

export function mapLessonContentType(contentType: string): TeacherLessonContentType {
  switch (contentType.toUpperCase()) {
    case 'PDF':
      return 'pdf';
    case 'READING':
      return 'reading';
    case 'EXERCISE':
      return 'exercise';
    case 'QUIZ':
      return 'quiz';
    case 'ASSIGNMENT':
      return 'assignment';
    case 'LIVE':
      return 'live';
    case 'AI_TUTOR':
      return 'ai_tutor';
    case 'VIDEO':
    default:
      return 'video';
  }
}

function durationMinutes(startsAt: string, endsAt: string | null): number {
  if (!endsAt) {
    return 0;
  }
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }
  return Math.round((end - start) / 60_000);
}

function sortLessons(lessons: LessonApiRecord[]): LessonApiRecord[] {
  return [...lessons].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }
    return left.title.localeCompare(right.title);
  });
}

function progressByLessonId(
  progressItems: StudentLessonProgressDto[],
): ReadonlyMap<string, StudentLessonProgressDto> {
  const map = new Map<string, StudentLessonProgressDto>();
  for (const item of progressItems) {
    const existing = map.get(item.lessonId);
    if (!existing || new Date(item.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      map.set(item.lessonId, item);
    }
  }
  return map;
}

function deriveLearningStatus(
  completedLessons: number,
  totalLessons: number,
  hasInProgress: boolean,
): StudentCourseLearningStatus {
  if (totalLessons > 0 && completedLessons >= totalLessons) {
    return 'completed';
  }
  if (completedLessons > 0 || hasInProgress) {
    return 'in_progress';
  }
  return 'not_started';
}

function findResumeLessonId(
  lessons: LessonApiRecord[],
  progressMap: ReadonlyMap<string, StudentLessonProgressDto>,
): string | null {
  const ordered = sortLessons(lessons);
  for (const lesson of ordered) {
    const progress = progressMap.get(lesson.id);
    if (progress?.status !== 'completed') {
      return lesson.id;
    }
  }
  return null;
}

function lastProgressAt(
  lessons: LessonApiRecord[],
  progressMap: ReadonlyMap<string, StudentLessonProgressDto>,
): string | null {
  let latest: string | null = null;
  for (const lesson of lessons) {
    const progress = progressMap.get(lesson.id);
    if (!progress) {
      continue;
    }
    if (!latest || new Date(progress.updatedAt).getTime() > new Date(latest).getTime()) {
      latest = progress.updatedAt;
    }
  }
  return latest;
}

export function buildStudentCourseModules(
  lessons: LessonApiRecord[],
  progressItems: StudentLessonProgressDto[],
): StudentCourseModuleDto[] {
  const progressMap = progressByLessonId(progressItems);
  const ordered = sortLessons(lessons);
  const moduleOrder = new Map<string, number>();
  const byModule = new Map<string, LessonApiRecord[]>();

  for (const lesson of ordered) {
    if (!moduleOrder.has(lesson.moduleId)) {
      moduleOrder.set(lesson.moduleId, moduleOrder.size + 1);
    }
    const bucket = byModule.get(lesson.moduleId) ?? [];
    bucket.push(lesson);
    byModule.set(lesson.moduleId, bucket);
  }

  const modules: StudentCourseModuleDto[] = [];
  for (const [moduleId, moduleLessons] of byModule) {
    const mappedLessons: StudentCourseLessonDto[] = moduleLessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description ?? '',
        contentType: mapLessonContentType(lesson.contentType),
        contentUrl: lesson.contentUrl,
        durationSeconds: lesson.durationSeconds,
        displayOrder: lesson.displayOrder,
        moduleId: lesson.moduleId,
        progressStatus: progress?.status ?? 'not_started',
        progressPercent: progress?.progressPercent ?? 0,
        completedAt: progress?.completedAt ?? null,
      };
    });

    const completedLessons = mappedLessons.filter(
      (lesson) => lesson.progressStatus === 'completed',
    ).length;
    const totalLessons = mappedLessons.length;

    modules.push({
      id: moduleId,
      title: 'Module',
      displayOrder: moduleOrder.get(moduleId) ?? 0,
      lessons: mappedLessons,
      progress: {
        completedLessons,
        totalLessons,
        percentage: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      },
    });
  }

  return modules.sort((left, right) => left.displayOrder - right.displayOrder);
}

export function mapEnrollmentToStudentCourseCard(
  enrollment: EnrollmentApiRecord,
  course: StudentCourseLookup | undefined,
  batch: StudentBatchLookup | undefined,
  lessons: LessonApiRecord[],
  progressItems: StudentLessonProgressDto[],
): StudentCourseCardDto {
  const progressMap = progressByLessonId(progressItems);
  const scopedLessons = lessons;
  const completedLessons = scopedLessons.filter((lesson) => {
    const progress = progressMap.get(lesson.id);
    return progress?.status === 'completed';
  }).length;
  const totalLessons = scopedLessons.length;
  const hasInProgress = scopedLessons.some((lesson) => {
    const progress = progressMap.get(lesson.id);
    return progress?.status === 'in_progress';
  });
  const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return {
    enrollmentId: enrollment.id,
    course: {
      id: enrollment.courseId,
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    batch: {
      id: enrollment.batchId,
      name: batch?.name ?? 'Batch',
    },
    description: course?.description ?? '',
    enrollmentStatus: mapEnrollmentStatus(enrollment.status),
    learningStatus: deriveLearningStatus(completedLessons, totalLessons, hasInProgress),
    progress: {
      completedLessons,
      totalLessons,
      percentage,
      resumeLessonId: findResumeLessonId(scopedLessons, progressMap),
    },
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    lastProgressAt: lastProgressAt(scopedLessons, progressMap),
    updatedAt: enrollment.updatedAt,
  };
}

export function mapEnrollmentToStudentCourseDetail(
  enrollment: EnrollmentApiRecord,
  course: StudentCourseLookup | undefined,
  batch: StudentBatchLookup | undefined,
  lessons: LessonApiRecord[],
  progressItems: StudentLessonProgressDto[],
): StudentCourseDetailDto {
  const card = mapEnrollmentToStudentCourseCard(enrollment, course, batch, lessons, progressItems);

  return {
    ...card,
    modules: buildStudentCourseModules(lessons, progressItems),
    capabilities: {
      mediaThumbnails: 'available',
      moduleTitles: 'coming_soon',
      teacherProfile: 'coming_soon',
    },
  };
}

export function mapStudentLessonPlayer(
  course: StudentCourseLookup,
  lessons: LessonApiRecord[],
  progressItems: StudentLessonProgressDto[],
  lessonId: string,
): StudentLessonPlayerDto | null {
  const ordered = sortLessons(lessons);
  const index = ordered.findIndex((lesson) => lesson.id === lessonId);
  const lesson = ordered[index];
  if (!lesson) {
    return null;
  }

  const progressMap = progressByLessonId(progressItems);
  const progress = progressMap.get(lesson.id);
  const modules = buildStudentCourseModules(lessons, progressItems);
  const completedLessons = ordered.filter(
    (item) => progressMap.get(item.id)?.status === 'completed',
  ).length;
  const totalLessons = ordered.length;

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      progress: {
        completedLessons,
        totalLessons,
        percentage: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      },
    },
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? '',
      contentType: mapLessonContentType(lesson.contentType),
      contentUrl: lesson.contentUrl,
      durationSeconds: lesson.durationSeconds,
      displayOrder: lesson.displayOrder,
      moduleId: lesson.moduleId,
      progressStatus: progress?.status ?? 'not_started',
      progressPercent: progress?.progressPercent ?? 0,
      completedAt: progress?.completedAt ?? null,
      lastPositionSeconds: progress?.lastPositionSeconds ?? null,
      navigation: {
        previousLessonId: index > 0 ? (ordered[index - 1]?.id ?? null) : null,
        nextLessonId:
          index >= 0 && index < ordered.length - 1 ? (ordered[index + 1]?.id ?? null) : null,
      },
    },
    curriculum: modules,
    capabilities: {
      videoStreaming: lesson.contentUrl ? 'available' : 'disabled',
      pdfViewer: lesson.contentUrl ? 'available' : 'disabled',
      lessonNotes: 'coming_soon',
      lessonResources: 'coming_soon',
      bookmarks: 'coming_soon',
      downloads: 'coming_soon',
    },
  };
}

export function mapStudentOwnSubmission(record: SubmissionApiRecord): StudentOwnSubmissionDto {
  return {
    id: record.id,
    status: mapSubmissionStatus(record.status),
    content: record.content,
    attachments: record.attachments.map((value, index) => ({
      id: `attachment_${String(index + 1)}`,
      label: value.trim().length > 0 ? value.trim() : `Attachment ${String(index + 1)}`,
    })),
    score: record.score,
    feedback: record.feedback,
    submittedAt: record.submittedAt,
    gradedAt: record.gradedAt,
    updatedAt: record.updatedAt,
  };
}

export function mapStudentAssignment(
  assignment: AssignmentApiRecord,
  course: StudentCourseLookup | undefined,
  batch: StudentBatchLookup | undefined,
  submission: SubmissionApiRecord | null,
): StudentAssignmentDto {
  return {
    id: assignment.id,
    title: assignment.title,
    instructions: assignment.instructions,
    status: mapAssignmentStatus(assignment.status),
    dueAt: assignment.dueAt,
    maxScore: assignment.maxScore,
    course: {
      id: assignment.courseId,
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    batch: assignment.batchId
      ? {
          id: assignment.batchId,
          name: batch?.name ?? 'Batch',
        }
      : null,
    submission: submission ? mapStudentOwnSubmission(submission) : null,
    capabilities: {
      fileUploads: 'available',
      plagiarismDetection: 'coming_soon',
      aiEvaluation: 'coming_soon',
    },
    updatedAt: assignment.updatedAt,
  };
}

export function mapStudentAttendanceRecord(
  record: AttendanceApiRecord,
  session: StudentLiveSessionLookup | undefined,
): StudentAttendanceRecordDto {
  return {
    id: record.id,
    liveSessionId: record.liveSessionId,
    status: mapStudentAttendanceStatus(record.status),
    markedAt: record.markedAt,
    notes: record.notes,
    session: {
      id: record.liveSessionId,
      title: session?.title ?? 'Live Session',
      startsAt: session?.startsAt ?? record.markedAt ?? record.createdAt,
      endsAt: session?.endsAt ?? null,
      course: {
        id: session?.courseId ?? '',
        slug: session?.courseSlug ?? '',
        title: session?.courseTitle ?? 'Course',
      },
      batch: {
        id: session?.batchId ?? '',
        name: session?.batchName ?? 'Batch',
      },
    },
    updatedAt: record.updatedAt,
  };
}

export function mapStudentAttendanceSummary(
  records: AttendanceApiRecord[],
  sessions: ReadonlyMap<string, StudentLiveSessionLookup>,
  meta: StudentAttendanceSummaryDto['meta'],
): StudentAttendanceSummaryDto {
  const mapped = records.map((record) =>
    mapStudentAttendanceRecord(record, sessions.get(record.liveSessionId)),
  );
  const presentCount = mapped.filter((item) => item.status === 'present').length;
  const absentCount = mapped.filter((item) => item.status === 'absent').length;
  const lateCount = mapped.filter((item) => item.status === 'late').length;
  const excusedCount = mapped.filter((item) => item.status === 'excused').length;
  const counted = presentCount + absentCount + lateCount;
  const attended = presentCount + lateCount;

  return {
    records: mapped,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendancePercent: counted === 0 ? null : Math.round((attended / counted) * 100),
    meta,
  };
}

export function mapStudentLiveClass(
  record: LiveSessionApiRecord,
  course: StudentCourseLookup | undefined,
  batch: StudentBatchLookup | undefined,
  attendanceStatus: StudentAttendanceMarkStatus | null,
): StudentLiveClassDto {
  const status = mapLiveStatus(record.status);
  const meetingUrl = record.meetingUrl;
  const recordingUrl = record.recordingUrl;

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? '',
    course: {
      id: course?.id ?? '',
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    batch: {
      id: record.batchId,
      name: batch?.name ?? 'Batch',
    },
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    durationMinutes: durationMinutes(record.startsAt, record.endsAt),
    status,
    meeting: {
      provider: mapMeetingProvider(record.meetingProvider),
      status: mapMeetingStatus(status, record.meetingProvider),
      meetingUrl,
    },
    recordingUrl,
    attendanceStatus,
    capabilities: {
      joinMeeting: meetingUrl ? 'available' : 'disabled',
      recordingPlayback: recordingUrl ? 'available' : 'disabled',
      calendarSync: 'coming_soon',
      meetingProvisioning: 'coming_soon',
    },
    updatedAt: record.updatedAt,
  };
}

export function buildStudentProgressOverview(
  courseCards: StudentCourseCardDto[],
  certificatesUnlocked: number,
): StudentProgressOverviewDto {
  const completedLessons = courseCards.reduce(
    (sum, course) => sum + course.progress.completedLessons,
    0,
  );
  const totalLessons = courseCards.reduce((sum, course) => sum + course.progress.totalLessons, 0);

  return {
    completedLessons,
    totalLessons,
    percentage: totalLessons === 0 ? null : Math.round((completedLessons / totalLessons) * 100),
    remainingLessons: Math.max(totalLessons - completedLessons, 0),
    courses: courseCards.map((course) => ({
      courseId: course.course.id,
      courseSlug: course.course.slug,
      courseTitle: course.course.title,
      completedLessons: course.progress.completedLessons,
      totalLessons: course.progress.totalLessons,
      percentage: course.progress.percentage,
      remainingLessons: Math.max(
        course.progress.totalLessons - course.progress.completedLessons,
        0,
      ),
    })),
    milestones: null,
    certificatesUnlocked,
  };
}

function section(
  id: string,
  title: string,
  description: string,
  emptyLabel: string,
  items: StudentDashboardSectionDto['items'],
): StudentDashboardSectionDto {
  return { id, title, description, emptyLabel, items };
}

export function mapStudentDashboard(input: {
  welcomeName: string | null;
  courses: StudentCourseCardDto[];
  liveClasses: StudentLiveClassDto[];
  assignments: StudentAssignmentDto[];
  notifications: TeacherNotificationDto[];
  calendarEvents: TeacherCalendarEventDto[];
  certificates: StudentCertificateDto[];
  attendancePercent: number | null;
  now?: Date;
}): StudentDashboardDto {
  const now = input.now ?? new Date();
  const todays = input.liveClasses
    .filter((session) => new Date(session.startsAt).toDateString() === now.toDateString())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const upcoming = input.liveClasses
    .filter(
      (session) =>
        new Date(session.startsAt).getTime() >= now.getTime() &&
        (session.status === 'scheduled' || session.status === 'live'),
    )
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const dueAssignments = input.assignments
    .filter(
      (assignment) =>
        assignment.dueAt !== null &&
        new Date(assignment.dueAt).getTime() >= now.getTime() &&
        assignment.status === 'published' &&
        (assignment.submission === null || assignment.submission.status === 'pending'),
    )
    .sort((left, right) => {
      const leftTime = left.dueAt ? new Date(left.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right.dueAt ? new Date(right.dueAt).getTime() : Number.POSITIVE_INFINITY;
      return leftTime - rightTime;
    });

  const completedLessons = input.courses.reduce(
    (sum, course) => sum + course.progress.completedLessons,
    0,
  );
  const issuedCertificates = input.certificates.filter(
    (certificate) => certificate.status === 'issued',
  ).length;

  const stats: StudentDashboardStatDto[] = [
    {
      id: 'enrolled-courses',
      label: 'Enrolled Courses',
      value: String(input.courses.length),
      helper: 'Courses from your enrollment records.',
    },
    {
      id: 'completed-lessons',
      label: 'Completed Lessons',
      value: String(completedLessons),
      helper: 'Lessons marked complete in your progress records.',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      value: input.attendancePercent === null ? null : `${String(input.attendancePercent)}%`,
      helper:
        input.attendancePercent === null
          ? 'No attendance records available yet.'
          : 'Derived from your attendance marks (present + late).',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      value: String(issuedCertificates),
      helper: 'Issued certificates in your account.',
    },
    {
      id: 'assignments-due',
      label: 'Assignments Due',
      value: String(dueAssignments.length),
      helper: 'Published assignments still awaiting your submission.',
    },
    {
      id: 'upcoming-live',
      label: 'Upcoming Live',
      value: String(upcoming.length),
      helper: 'Scheduled or live sessions from now onward.',
    },
  ];

  return {
    welcomeName: input.welcomeName,
    stats,
    todaysClasses: section(
      'todays-classes',
      "Today's Classes",
      'Live sessions scheduled for today.',
      'No classes scheduled today',
      todays.slice(0, 5).map((session) => ({
        id: session.id,
        title: session.title,
        detail: `${session.startsAt} · ${session.status}`,
      })),
    ),
    upcomingLive: section(
      'upcoming-live',
      'Upcoming Live Sessions',
      'Your next live classes.',
      'No upcoming live sessions',
      upcoming.slice(0, 5).map((session) => ({
        id: session.id,
        title: session.title,
        detail: `${session.startsAt} · ${session.course.title}`,
      })),
    ),
    currentCourses: input.courses.filter(
      (course) => course.enrollmentStatus === 'active' && course.learningStatus !== 'completed',
    ),
    assignmentsDue: dueAssignments.slice(0, 5),
    recentNotifications: input.notifications.slice(0, 10),
    calendarPreview: input.calendarEvents.slice(0, 10),
    certificates: input.certificates.slice(0, 5),
    attendancePercent: input.attendancePercent,
    capabilities: {
      analyticsApi: 'disabled',
      payments: 'available',
      emailDelivery: 'coming_soon',
      cloudinaryMedia: 'available',
      zoomOAuth: 'coming_soon',
      googleCalendarSync: 'coming_soon',
      pdfGeneration: 'available',
      qrGeneration: 'available',
    },
  };
}

export function mapStudentProfile(
  user: AuthSessionUser,
  options?: {
    learning?: StudentProgressOverviewDto | null;
    certificates?: StudentCertificateDto[];
  },
): StudentProfileDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roles: user.roles,
    organizationIds: user.organizationIds,
    avatarUrl: user.profileImage ?? null,
    learning: options?.learning ?? null,
    certificates: options?.certificates ?? [],
    preferences: {
      theme: 'system',
      language: null,
      timezone: null,
    },
    capabilities: {
      avatarUpload: 'available',
      profileEditing: 'coming_soon',
      preferenceSync: 'coming_soon',
      passwordChange: 'coming_soon',
      twoFactor: 'coming_soon',
    },
  };
}

export function toStudentCourseLookup(record: CourseApiRecord): StudentCourseLookup {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description ?? '',
  };
}
