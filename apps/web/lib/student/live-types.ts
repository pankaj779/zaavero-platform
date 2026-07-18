import type {
  TeacherLiveClassStatus,
  TeacherMeetingProvider,
  TeacherMeetingStatus,
} from '../teacher/live-session-types';
import type {
  StudentBatchRefDto,
  StudentCourseRefDto,
  StudentIntegrationAvailability,
} from './course-types';
import type { StudentAttendanceMarkStatus } from './attendance-types';

/**
 * Student live-class view-model.
 * Preserves meetingUrl / recordingUrl from raw Live Session API records
 * (teacher DTO intentionally nulls these for its UI contract).
 */

export interface StudentLiveClassMeetingDto {
  provider: TeacherMeetingProvider;
  status: TeacherMeetingStatus;
  meetingUrl: string | null;
}

export interface StudentLiveClassCapabilitiesDto {
  joinMeeting: StudentIntegrationAvailability;
  recordingPlayback: StudentIntegrationAvailability;
  calendarSync: StudentIntegrationAvailability;
  meetingProvisioning: StudentIntegrationAvailability;
}

export interface StudentLiveClassDto {
  id: string;
  title: string;
  description: string;
  course: StudentCourseRefDto;
  batch: StudentBatchRefDto;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number;
  status: TeacherLiveClassStatus;
  meeting: StudentLiveClassMeetingDto;
  recordingUrl: string | null;
  /** Own attendance mark when an attendance row exists for this session; otherwise null. */
  attendanceStatus: StudentAttendanceMarkStatus | null;
  capabilities: StudentLiveClassCapabilitiesDto;
  updatedAt: string;
}

export interface StudentLiveClassListResult {
  items: StudentLiveClassDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
