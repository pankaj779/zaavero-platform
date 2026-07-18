export type {
  StudentLessonProgressStatus,
  StudentLessonProgressDto,
  StudentProgressCourseRollupDto,
  StudentProgressOverviewDto,
} from './progress-types';

export type {
  StudentEnrollmentStatus,
  StudentCourseLearningStatus,
  StudentCourseRefDto,
  StudentBatchRefDto,
  StudentCourseProgressDto,
  StudentCourseCardDto,
  StudentCourseLessonDto,
  StudentCourseModuleDto,
  StudentIntegrationAvailability,
  StudentCourseCapabilitiesDto,
  StudentCourseDetailDto,
  StudentCourseListResult,
} from './course-types';

export type {
  StudentLessonNavigationDto,
  StudentLessonPlayerLessonDto,
  StudentLessonPlayerCapabilitiesDto,
  StudentLessonPlayerDto,
} from './player-types';

export type {
  StudentLiveClassMeetingDto,
  StudentLiveClassCapabilitiesDto,
  StudentLiveClassDto,
  StudentLiveClassListResult,
} from './live-types';

export type {
  StudentAttendanceMarkStatus,
  StudentAttendanceSessionRefDto,
  StudentAttendanceRecordDto,
  StudentAttendanceSummaryDto,
} from './attendance-types';

export type {
  StudentOwnSubmissionDto,
  StudentAssignmentCapabilitiesDto,
  StudentAssignmentDto,
  StudentAssignmentListResult,
} from './assignment-types';

export type {
  StudentDashboardStatDto,
  StudentDashboardSectionItemDto,
  StudentDashboardSectionDto,
  StudentDashboardCapabilitiesDto,
  StudentDashboardDto,
} from './dashboard-types';

export type {
  StudentProfilePreferencesDto,
  StudentProfileCapabilitiesDto,
  StudentProfileDto,
  StudentProfileAuthInput,
} from './profile-types';

/** Re-export shared Teacher domain DTOs that Student surfaces reuse as-is. */
export type { StudentCertificateDto, StudentCertificateStatus } from '../teacher/certificate-types';
export type { TeacherNotificationDto } from '../teacher/notification-types';
export type { TeacherCalendarEventDto } from '../teacher/calendar-types';
export type { TeacherConversationDto, TeacherMessageDto } from '../teacher/message-types';
export type { TeacherLessonContentType } from '../teacher/lesson-types';
export type {
  TeacherLiveClassStatus,
  TeacherMeetingProvider,
  TeacherMeetingStatus,
} from '../teacher/live-session-types';
export type { TeacherAssignmentStatus } from '../teacher/assignment-types';
export type { TeacherSubmissionStatus } from '../teacher/submission-types';
