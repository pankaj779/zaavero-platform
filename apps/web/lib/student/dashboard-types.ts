import type { StudentCertificateDto } from '../teacher/certificate-types';
import type { TeacherCalendarEventDto } from '../teacher/calendar-types';
import type { TeacherNotificationDto } from '../teacher/notification-types';
import type { StudentAssignmentDto } from './assignment-types';
import type { StudentCourseCardDto, StudentIntegrationAvailability } from './course-types';

/**
 * Student dashboard aggregate — derived only from fetched module records.
 */

export interface StudentDashboardStatDto {
  id: string;
  label: string;
  /** Stringified count/rate, or null when the metric cannot be derived honestly. */
  value: string | null;
  helper: string;
}

export interface StudentDashboardSectionItemDto {
  id: string;
  title: string;
  detail: string;
}

export interface StudentDashboardSectionDto {
  id: string;
  title: string;
  description: string;
  emptyLabel: string;
  items: StudentDashboardSectionItemDto[];
}

export interface StudentDashboardCapabilitiesDto {
  analyticsApi: StudentIntegrationAvailability;
  payments: StudentIntegrationAvailability;
  emailDelivery: StudentIntegrationAvailability;
  cloudinaryMedia: StudentIntegrationAvailability;
  zoomOAuth: StudentIntegrationAvailability;
  googleCalendarSync: StudentIntegrationAvailability;
  pdfGeneration: StudentIntegrationAvailability;
  qrGeneration: StudentIntegrationAvailability;
}

export interface StudentDashboardDto {
  /** Display name supplied by the caller from AuthSessionUser; never fabricated. */
  welcomeName: string | null;
  stats: StudentDashboardStatDto[];
  todaysClasses: StudentDashboardSectionDto;
  upcomingLive: StudentDashboardSectionDto;
  currentCourses: StudentCourseCardDto[];
  assignmentsDue: StudentAssignmentDto[];
  recentNotifications: TeacherNotificationDto[];
  calendarPreview: TeacherCalendarEventDto[];
  certificates: StudentCertificateDto[];
  /** Null when no attendance rows were fetched. */
  attendancePercent: number | null;
  capabilities: StudentDashboardCapabilitiesDto;
}
