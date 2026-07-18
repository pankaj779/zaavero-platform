/**
 * Student own-attendance view-model.
 * Preserves late/excused (teacher attendance DTO collapses these).
 */

export type StudentAttendanceMarkStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceSessionRefDto {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
  };
  batch: {
    id: string;
    name: string;
  };
}

export interface StudentAttendanceRecordDto {
  id: string;
  liveSessionId: string;
  status: StudentAttendanceMarkStatus;
  markedAt: string | null;
  notes: string | null;
  session: StudentAttendanceSessionRefDto;
  updatedAt: string;
}

export interface StudentAttendanceSummaryDto {
  records: StudentAttendanceRecordDto[];
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  /** Null when there are no attendance records to derive a rate from. */
  attendancePercent: number | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
