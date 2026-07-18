import type {
  AttendanceCountsDto,
  AttendanceRecordDto,
  AttendanceSessionDto,
  AttendanceSessionStatus,
  AttendanceStudentStatus,
} from '../teacher/attendance-types';

/** Raw attendance payload from NestJS Attendance API (frontend-owned mirror). */
export interface AttendanceApiRecord {
  id: string;
  organizationId: string;
  liveSessionId: string;
  studentId: string;
  status: string;
  markedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceListResult {
  items: AttendanceSessionDto[];
  meta: AttendanceListMeta;
}

/** Live-session shell used to enrich session-centric attendance cards. */
export interface AttendanceLiveSessionLookup {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  updatedAt: string;
  batchId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  batchName: string;
  studentsEnrolled: number;
  durationMinutes: number;
}

function mapStudentStatus(status: string): AttendanceStudentStatus {
  switch (status.toUpperCase()) {
    case 'PRESENT':
    case 'LATE':
      return 'present';
    case 'ABSENT':
    case 'EXCUSED':
    default:
      return 'absent';
  }
}

function mapSessionStatus(status: string): AttendanceSessionStatus {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'LIVE':
    case 'SCHEDULED':
    default:
      return 'scheduled';
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

function buildInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'ST';
  }
  const first = parts[0];
  if (!first) {
    return 'ST';
  }
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  const last = parts[parts.length - 1];
  if (!last) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/**
 * Maps a NestJS attendance row to a roster record DTO.
 *
 * TEMPORARY PLACEHOLDERS (until student profile endpoints exist):
 * - studentName / initials (API returns studentId only)
 */
export function mapAttendanceApiToRecordDto(record: AttendanceApiRecord): AttendanceRecordDto {
  // TEMPORARY: student identity is not on AttendanceResponseDto.
  const studentName = 'Student';

  return {
    studentId: record.studentId,
    studentName,
    initials: buildInitials(studentName),
    status: mapStudentStatus(record.status),
  };
}

function buildCounts(
  sessionStatus: AttendanceSessionStatus,
  records: AttendanceRecordDto[],
  studentsEnrolled: number,
): AttendanceCountsDto {
  const present = records.filter((record) => record.status === 'present').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const totalStudents = records.length > 0 ? records.length : Math.max(studentsEnrolled, 0);

  if (sessionStatus !== 'completed' || records.length === 0) {
    return {
      totalStudents,
      present: sessionStatus === 'completed' ? present : 0,
      absent: sessionStatus === 'completed' ? absent : 0,
      attendancePercent: null,
    };
  }

  return {
    totalStudents,
    present,
    absent,
    attendancePercent: Math.round((present / totalStudents) * 100),
  };
}

function emptySessionFromLookup(lookup: AttendanceLiveSessionLookup): AttendanceSessionDto {
  const status = mapSessionStatus(lookup.status);
  const records: AttendanceRecordDto[] = [];

  return {
    id: lookup.id,
    title: lookup.title,
    course: {
      id: lookup.courseId,
      slug: lookup.courseSlug,
      title: lookup.courseTitle || 'Course',
    },
    batch: {
      id: lookup.batchId,
      name: lookup.batchName || 'Batch',
    },
    // TEMPORARY: mentor identity is not on Attendance / LiveSession responses.
    mentor: {
      id: '',
      name: 'Teacher',
    },
    status,
    sessionDate: lookup.startsAt,
    durationMinutes: lookup.durationMinutes,
    // UI keeps meeting fields opaque until provisioning is wired.
    meetingProvider: null,
    meetingUrl: null,
    counts: buildCounts(status, records, lookup.studentsEnrolled),
    records,
    updatedAt: lookup.updatedAt,
  };
}

/**
 * Groups NestJS attendance rows into session-centric teacher DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - course / batch titles (enriched via live-session lookups when available)
 * - mentor name
 * - student name / avatar
 * - meeting provider / URL (kept null for the current UI contract)
 */
export function mapAttendancesToSessionDtos(
  records: AttendanceApiRecord[],
  liveSessions?: ReadonlyMap<string, AttendanceLiveSessionLookup>,
): AttendanceSessionDto[] {
  const bySession = new Map<string, AttendanceApiRecord[]>();
  for (const record of records) {
    const existing = bySession.get(record.liveSessionId) ?? [];
    existing.push(record);
    bySession.set(record.liveSessionId, existing);
  }

  const sessionIds = new Set<string>([
    ...bySession.keys(),
    ...(liveSessions ? liveSessions.keys() : []),
  ]);

  const sessions: AttendanceSessionDto[] = [];

  for (const sessionId of sessionIds) {
    const lookup = liveSessions?.get(sessionId);
    const sessionRecords = bySession.get(sessionId) ?? [];
    const roster = sessionRecords.map(mapAttendanceApiToRecordDto);

    if (lookup) {
      const status = mapSessionStatus(lookup.status);
      const latestUpdated =
        sessionRecords.length > 0
          ? sessionRecords.reduce(
              (latest, record) =>
                new Date(record.updatedAt).getTime() > new Date(latest).getTime()
                  ? record.updatedAt
                  : latest,
              lookup.updatedAt,
            )
          : lookup.updatedAt;

      sessions.push({
        id: lookup.id,
        title: lookup.title,
        course: {
          id: lookup.courseId,
          slug: lookup.courseSlug,
          title: lookup.courseTitle || 'Course',
        },
        batch: {
          id: lookup.batchId,
          name: lookup.batchName || 'Batch',
        },
        mentor: {
          id: '',
          name: 'Teacher',
        },
        status,
        sessionDate: lookup.startsAt,
        durationMinutes: lookup.durationMinutes,
        meetingProvider: null,
        meetingUrl: null,
        counts: buildCounts(status, roster, lookup.studentsEnrolled),
        records: status === 'completed' ? roster : [],
        updatedAt: latestUpdated,
      });
      continue;
    }

    // TEMPORARY: live-session metadata missing — placeholder shell from attendance rows.
    const firstRecord = sessionRecords[0];
    if (!firstRecord) {
      continue;
    }
    const latest = sessionRecords.reduce(
      (acc, record) =>
        new Date(record.updatedAt).getTime() > new Date(acc.updatedAt).getTime() ? record : acc,
      firstRecord,
    );
    const status: AttendanceSessionStatus = 'completed';
    sessions.push({
      id: sessionId,
      title: 'Live Session',
      course: { id: '', slug: '', title: 'Course' },
      batch: { id: '', name: 'Batch' },
      mentor: { id: '', name: 'Teacher' },
      status,
      sessionDate: latest.markedAt ?? latest.createdAt,
      durationMinutes: 0,
      meetingProvider: null,
      meetingUrl: null,
      counts: buildCounts(status, roster, roster.length),
      records: roster,
      updatedAt: latest.updatedAt,
    });
  }

  return sessions;
}

/** Maps a single attendance row into a one-record session DTO (detail/mutation responses). */
export function mapAttendanceApiToTeacherSessionDto(
  record: AttendanceApiRecord,
  liveSessions?: ReadonlyMap<string, AttendanceLiveSessionLookup>,
): AttendanceSessionDto {
  const [session] = mapAttendancesToSessionDtos([record], liveSessions);
  if (session) {
    return session;
  }
  return emptySessionFromLookup({
    id: record.liveSessionId,
    title: 'Live Session',
    status: 'COMPLETED',
    startsAt: record.markedAt ?? record.createdAt,
    endsAt: null,
    updatedAt: record.updatedAt,
    batchId: '',
    courseId: '',
    courseSlug: '',
    courseTitle: 'Course',
    batchName: 'Batch',
    studentsEnrolled: 0,
    durationMinutes: 0,
  });
}

export function mapAttendanceApiList(
  records: AttendanceApiRecord[],
  liveSessions?: ReadonlyMap<string, AttendanceLiveSessionLookup>,
): AttendanceSessionDto[] {
  return mapAttendancesToSessionDtos(records, liveSessions);
}

export { durationMinutes as attendanceDurationMinutes };
