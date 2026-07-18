export { AdminApi } from './admin';
export type {
  AdminAuditParams,
  AdminListUsersParams,
  CreateAdminUserInput,
  UpdateAdminOrganizationInput,
  UpdateAdminTeacherInput,
  UpdateAdminUserInput,
} from './admin';
export {
  mapAdminAuditList,
  mapAdminAuditLog,
  mapAdminOrganization,
  mapAdminOverview,
  mapAdminPermissions,
  mapAdminRole,
  mapAdminUser,
  mapAdminUserList,
  type AdminUserApiRecord,
  type AdminUserListApiPayload,
} from './admin-mapper';
export { AnalyticsApi } from './analytics';
export { TeacherDashboardApi } from './dashboard';
export { mapTeacherDashboard } from './dashboard-mapper';
export { CourseApi } from './course';
export type { CreateCourseInput, ListCoursesParams, UpdateCourseInput } from './course';
export {
  mapCourseApiList,
  mapCourseApiToTeacherSummary,
  type CourseApiRecord,
  type CourseListMeta,
  type CourseListResult,
} from './course-mapper';
export { BatchApi } from './batch';
export type { CreateBatchInput, ListBatchesParams, UpdateBatchInput } from './batch';
export {
  mapBatchApiList,
  mapBatchApiToTeacherSummary,
  type BatchApiRecord,
  type BatchCourseLookup,
  type BatchListMeta,
  type BatchListResult,
} from './batch-mapper';
export { EnrollmentApi } from './enrollment';
export type {
  CreateEnrollmentInput,
  ListEnrollmentsParams,
  UpdateEnrollmentInput,
} from './enrollment';
export {
  mapEnrollmentApiList,
  mapEnrollmentApiToTeacherStudent,
  type EnrollmentApiRecord,
  type EnrollmentBatchLookup,
  type EnrollmentCourseLookup,
  type EnrollmentListMeta,
  type EnrollmentListResult,
} from './enrollment-mapper';
export { LessonApi } from './lesson';
export type { CreateLessonInput, ListLessonsParams, UpdateLessonInput } from './lesson';
export {
  mapLessonApiList,
  mapLessonApiToTeacherSummary,
  type LessonApiRecord,
  type LessonCourseLookup,
  type LessonListMeta,
  type LessonListResult,
} from './lesson-mapper';
export { LiveSessionApi } from './live-session';
export type {
  CreateLiveSessionInput,
  ListLiveSessionsParams,
  UpdateLiveSessionInput,
} from './live-session';
export {
  mapLiveSessionApiList,
  mapLiveSessionApiToTeacherDto,
  type LiveSessionApiRecord,
  type LiveSessionBatchLookup,
  type LiveSessionCourseLookup,
  type LiveSessionListMeta,
  type LiveSessionListResult,
} from './live-session-mapper';
export { AttendanceApi } from './attendance';
export type {
  CreateAttendanceInput,
  ListAttendancesParams,
  UpdateAttendanceInput,
} from './attendance';
export {
  mapAttendanceApiList,
  mapAttendanceApiToRecordDto,
  mapAttendanceApiToTeacherSessionDto,
  mapAttendancesToSessionDtos,
  type AttendanceApiRecord,
  type AttendanceListMeta,
  type AttendanceListResult,
  type AttendanceLiveSessionLookup,
} from './attendance-mapper';
export { AssignmentApi } from './assignment';
export type {
  CreateAssignmentInput,
  ListAssignmentsParams,
  UpdateAssignmentInput,
} from './assignment';
export {
  mapAssignmentApiList,
  mapAssignmentApiToTeacherSummary,
  type AssignmentApiRecord,
  type AssignmentBatchLookup,
  type AssignmentCourseLookup,
  type AssignmentListMeta,
  type AssignmentListResult,
} from './assignment-mapper';
export { SubmissionApi } from './submission';
export type {
  CreateSubmissionInput,
  ListSubmissionsParams,
  UpdateSubmissionInput,
} from './submission';
export {
  mapSubmissionApiList,
  mapSubmissionApiToTeacherSummary,
  type SubmissionApiRecord,
  type SubmissionAssignmentLookup,
  type SubmissionListMeta,
  type SubmissionListResult,
} from './submission-mapper';
export { CertificateApi } from './certificate';
export type { IssueCertificateInput, ListCertificatesParams } from './certificate';
export {
  collectCertificateTemplateIds,
  mapCertificateApiList,
  mapCertificateApiToTeacherSummary,
  type CertificateApiRecord,
  type CertificateBatchLookup,
  type CertificateCourseLookup,
  type CertificateListMeta,
  type CertificateListResult,
} from './certificate-mapper';
export { CalendarApi } from './calendar';
export type {
  CreateCalendarEventInput,
  ListCalendarEventsParams,
  UpdateCalendarEventInput,
} from './calendar';
export {
  deriveCalendarEventStatus,
  deriveCalendarEventType,
  mapCalendarApiList,
  mapCalendarApiToTeacherEvent,
  type CalendarApiRecord,
  type CalendarBatchLookup,
  type CalendarCourseLookup,
  type CalendarListMeta,
  type CalendarListResult,
} from './calendar-mapper';
export { NotificationApi } from './notification';
export type {
  ListNotificationsParams,
  MarkAllNotificationsReadResult,
  UpdateNotificationInput,
} from './notification';
export {
  mapNotificationApiList,
  mapNotificationApiToTeacherDto,
  mapNotificationType,
  type NotificationApiRecord,
  type NotificationListMeta,
  type NotificationListResult,
} from './notification-mapper';
export { MessagingApi } from './messaging';
export type {
  CreateConversationInput,
  CreateMessageInput,
  ListConversationsParams,
  ListMessagesParams,
  UpdateConversationInput,
} from './messaging';
export {
  mapConversationApiList,
  mapConversationApiToTeacherDto,
  mapConversationType,
  mapMessageApiToTeacherDto,
  type ConversationApiRecord,
  type ConversationListResult,
  type ConversationParticipantApiRecord,
  type MessageApiRecord,
  type MessageListResult,
  type MessagingCurrentUser,
  type MessagingListMeta,
} from './messaging-mapper';
export { LessonProgressApi } from './lesson-progress';
export type {
  CreateLessonProgressInput,
  ListLessonProgressParams,
  MarkLessonCompleteInput,
  UpdateLessonProgressInput,
} from './lesson-progress';
export {
  mapLessonProgressApiList,
  mapLessonProgressApiToDto,
  mapLessonProgressStatus,
  type LessonProgressApiRecord,
  type LessonProgressListMeta,
  type LessonProgressListResult,
} from './lesson-progress-mapper';
export { StudentApi } from './student';
export type {
  StudentAssignmentsParams,
  StudentAttendanceParams,
  StudentCoursesParams,
  StudentDashboardParams,
  StudentListParams,
  StudentLiveClassesParams,
  StudentSubmitAssignmentInput,
} from './student';
export {
  buildStudentCourseModules,
  buildStudentProgressOverview,
  mapEnrollmentToStudentCourseCard,
  mapEnrollmentToStudentCourseDetail,
  mapLessonContentType,
  mapStudentAssignment,
  mapStudentAttendanceRecord,
  mapStudentAttendanceStatus,
  mapStudentAttendanceSummary,
  mapStudentDashboard,
  mapStudentLessonPlayer,
  mapStudentLiveClass,
  mapStudentOwnSubmission,
  mapStudentProfile,
  toStudentCourseLookup,
  type StudentBatchLookup,
  type StudentCourseLookup,
  type StudentLiveSessionLookup,
} from './student-mapper';
export { PaymentApi } from './payment';
export type { AdminPlansParams, PaymentListParams } from './payment';
export {
  mapAdminOverview as mapPaymentAdminOverview,
  mapCatalog,
  mapCoupon,
  mapInvoice,
  mapPaymentConfig,
  mapPaymentHistoryItem,
  mapPaymentListMeta,
  mapPaymentOrder,
  mapPaymentOrderStatus,
  mapPlan,
  mapRefund,
  mapSubscription,
  mapTransaction,
  mapMoneyDisplay,
  type PaymentOrderApiRecord,
  type PaymentConfigApiRecord,
} from './payment-mapper';
