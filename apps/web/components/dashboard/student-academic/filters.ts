import type {
  StudentAssignmentDto,
  StudentAttendanceMarkStatus,
  StudentAttendanceRecordDto,
  StudentLiveClassDto,
} from '../../../lib/student';
import type { StudentCertificateDto, StudentCertificateStatus } from '../../../lib/student';
import { isStudentVisibleAssignmentStatus } from './capabilities';

export type StudentViewState = 'loading' | 'empty' | 'error' | 'populated';

export type StudentLiveScheduleFilter = 'all' | 'today' | 'upcoming' | 'completed';
export type StudentLiveStatusFilter = 'all' | StudentLiveClassDto['status'];
export type StudentLiveSortOption = 'upcoming' | 'recently_updated' | 'alphabetical';

export type StudentAssignmentStatusFilter = 'all' | 'published' | 'closed';
export type StudentAssignmentSortOption = 'due_soon' | 'recently_updated' | 'alphabetical';

export type StudentAttendanceStatusFilter = 'all' | StudentAttendanceMarkStatus;
export type StudentAttendanceSortOption = 'session_date' | 'recently_marked' | 'status';

export type StudentCertificateStatusFilter = 'all' | StudentCertificateStatus;
export type StudentCertificateSortOption = 'newest' | 'course' | 'status';

export function isSameLocalDay(iso: string, now = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function filterStudentLiveClasses(
  sessions: StudentLiveClassDto[],
  query: string,
  status: StudentLiveStatusFilter,
  schedule: StudentLiveScheduleFilter,
  options?: { courseId?: string; batchId?: string },
  now = new Date(),
): StudentLiveClassDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId;
  const batchId = options?.batchId;

  return sessions.filter((session) => {
    if (status !== 'all' && session.status !== status) {
      return false;
    }
    if (courseId && courseId !== 'all' && session.course.id !== courseId) {
      return false;
    }
    if (batchId && batchId !== 'all' && session.batch.id !== batchId) {
      return false;
    }

    if (schedule === 'today' && !isSameLocalDay(session.startsAt, now)) {
      return false;
    }
    if (schedule === 'upcoming') {
      const upcoming =
        (session.status === 'scheduled' || session.status === 'live') &&
        new Date(session.startsAt).getTime() >= now.getTime() - 60 * 60 * 1000;
      if (!upcoming) {
        return false;
      }
    }
    if (schedule === 'completed' && session.status !== 'completed') {
      return false;
    }

    if (!normalized) {
      return true;
    }
    return (
      session.title.toLowerCase().includes(normalized) ||
      session.course.title.toLowerCase().includes(normalized) ||
      session.batch.name.toLowerCase().includes(normalized)
    );
  });
}

export function sortStudentLiveClasses(
  sessions: StudentLiveClassDto[],
  sort: StudentLiveSortOption,
): StudentLiveClassDto[] {
  const next = [...sessions];
  switch (sort) {
    case 'recently_updated':
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'upcoming':
    default:
      return next.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }
}

export function deriveStudentLiveStats(sessions: StudentLiveClassDto[], now = new Date()) {
  const today = sessions.filter((s) => isSameLocalDay(s.startsAt, now)).length;
  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'live').length;
  const completed = sessions.filter((s) => s.status === 'completed').length;
  const attended = sessions.filter(
    (s) => s.attendanceStatus === 'present' || s.attendanceStatus === 'late',
  ).length;

  return [
    {
      id: 'today',
      label: 'Today',
      value: String(today),
      helper: 'Sessions starting today.',
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      value: String(upcoming),
      helper: 'Scheduled or live sessions.',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: String(completed),
      helper: 'Finished live classes.',
    },
    {
      id: 'attended',
      label: 'Marked present',
      value: String(attended),
      helper: 'Present or late on your records.',
    },
  ];
}

export function filterStudentAssignments(
  assignments: StudentAssignmentDto[],
  query: string,
  status: StudentAssignmentStatusFilter,
  options?: { courseId?: string; batchId?: string },
): StudentAssignmentDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId;
  const batchId = options?.batchId;

  return assignments.filter((assignment) => {
    if (!isStudentVisibleAssignmentStatus(assignment.status)) {
      return false;
    }
    if (status !== 'all' && assignment.status !== status) {
      return false;
    }
    if (courseId && courseId !== 'all' && assignment.course.id !== courseId) {
      return false;
    }
    if (batchId && batchId !== 'all' && assignment.batch?.id !== batchId) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      assignment.title.toLowerCase().includes(normalized) ||
      assignment.course.title.toLowerCase().includes(normalized) ||
      (assignment.batch?.name.toLowerCase().includes(normalized) ?? false)
    );
  });
}

export function sortStudentAssignments(
  assignments: StudentAssignmentDto[],
  sort: StudentAssignmentSortOption,
): StudentAssignmentDto[] {
  const next = [...assignments];
  switch (sort) {
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently_updated':
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'due_soon':
    default:
      return next.sort((a, b) => {
        if (a.dueAt === null && b.dueAt === null) {
          return 0;
        }
        if (a.dueAt === null) {
          return 1;
        }
        if (b.dueAt === null) {
          return -1;
        }
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
  }
}

export function deriveStudentAssignmentStats(assignments: StudentAssignmentDto[]) {
  const visible = assignments.filter((a) => isStudentVisibleAssignmentStatus(a.status));
  const dueSoon = visible.filter((a) => {
    if (!a.dueAt) {
      return false;
    }
    const due = new Date(a.dueAt).getTime();
    const now = Date.now();
    return due >= now && due - now <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const submitted = visible.filter(
    (a) =>
      a.submission?.status === 'submitted' ||
      a.submission?.status === 'graded' ||
      a.submission?.status === 'late',
  ).length;
  const graded = visible.filter((a) => a.submission?.status === 'graded').length;
  const returned = visible.filter((a) => a.submission?.status === 'returned').length;

  return [
    {
      id: 'open',
      label: 'Open',
      value: String(visible.filter((a) => a.status === 'published').length),
      helper: 'Published assignments available to submit.',
    },
    {
      id: 'due-soon',
      label: 'Due soon',
      value: String(dueSoon),
      helper: 'Due within the next 7 days.',
    },
    {
      id: 'submitted',
      label: 'Submitted',
      value: String(submitted),
      helper: 'Your submitted work.',
    },
    {
      id: 'feedback',
      label: 'Graded / returned',
      value: String(graded + returned),
      helper: 'Assignments with grade or return feedback.',
    },
  ];
}

export function filterStudentAttendance(
  records: StudentAttendanceRecordDto[],
  query: string,
  status: StudentAttendanceStatusFilter,
  options?: { courseId?: string; batchId?: string; liveSessionId?: string },
): StudentAttendanceRecordDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId;
  const batchId = options?.batchId;
  const liveSessionId = options?.liveSessionId;

  return records.filter((record) => {
    if (status !== 'all' && record.status !== status) {
      return false;
    }
    if (courseId && courseId !== 'all' && record.session.course.id !== courseId) {
      return false;
    }
    if (batchId && batchId !== 'all' && record.session.batch.id !== batchId) {
      return false;
    }
    if (liveSessionId && liveSessionId !== 'all' && record.liveSessionId !== liveSessionId) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      record.session.title.toLowerCase().includes(normalized) ||
      record.session.course.title.toLowerCase().includes(normalized) ||
      record.session.batch.name.toLowerCase().includes(normalized)
    );
  });
}

export function sortStudentAttendance(
  records: StudentAttendanceRecordDto[],
  sort: StudentAttendanceSortOption,
): StudentAttendanceRecordDto[] {
  const next = [...records];
  switch (sort) {
    case 'status':
      return next.sort((a, b) => a.status.localeCompare(b.status));
    case 'recently_marked':
      return next.sort((a, b) => {
        const aTime = a.markedAt ? new Date(a.markedAt).getTime() : 0;
        const bTime = b.markedAt ? new Date(b.markedAt).getTime() : 0;
        return bTime - aTime;
      });
    case 'session_date':
    default:
      return next.sort(
        (a, b) => new Date(b.session.startsAt).getTime() - new Date(a.session.startsAt).getTime(),
      );
  }
}

export function filterStudentCertificates(
  certificates: StudentCertificateDto[],
  query: string,
  status: StudentCertificateStatusFilter,
  options?: { courseId?: string },
): StudentCertificateDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId;

  return certificates.filter((certificate) => {
    if (status !== 'all' && certificate.status !== status) {
      return false;
    }
    if (courseId && courseId !== 'all' && certificate.course.id !== courseId) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      certificate.course.title.toLowerCase().includes(normalized) ||
      certificate.batch.name.toLowerCase().includes(normalized) ||
      (certificate.certificateNumber?.toLowerCase().includes(normalized) ?? false)
    );
  });
}

export function sortStudentCertificates(
  certificates: StudentCertificateDto[],
  sort: StudentCertificateSortOption,
): StudentCertificateDto[] {
  const next = [...certificates];
  switch (sort) {
    case 'course':
      return next.sort((a, b) => a.course.title.localeCompare(b.course.title));
    case 'status':
      return next.sort((a, b) => a.status.localeCompare(b.status));
    case 'newest':
    default:
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export function deriveStudentCertificateStats(certificates: StudentCertificateDto[]) {
  return [
    {
      id: 'issued',
      label: 'Issued',
      value: String(certificates.filter((c) => c.status === 'issued').length),
      helper: 'Certificates already issued to you.',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: String(certificates.filter((c) => c.status === 'pending').length),
      helper: 'Awaiting issuance.',
    },
    {
      id: 'eligible',
      label: 'Eligible',
      value: String(certificates.filter((c) => c.status === 'eligible').length),
      helper: 'Ready for recommendation.',
    },
    {
      id: 'revoked',
      label: 'Revoked',
      value: String(certificates.filter((c) => c.status === 'revoked').length),
      helper: 'Revoked certificates.',
    },
  ];
}

/** Ensures list/mutation calls always carry a concrete organization id. */
export function requireOrganizationId(organizationId: string | null | undefined): string {
  if (!organizationId || organizationId.trim().length === 0) {
    throw new Error('Organization is required for student academic requests.');
  }
  return organizationId;
}

export function toAttendanceApiStatus(
  status: StudentAttendanceStatusFilter,
): 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | undefined {
  switch (status) {
    case 'present':
      return 'PRESENT';
    case 'absent':
      return 'ABSENT';
    case 'late':
      return 'LATE';
    case 'excused':
      return 'EXCUSED';
    default:
      return undefined;
  }
}

export function toCertificateApiStatus(
  status: StudentCertificateStatusFilter,
): 'ELIGIBLE' | 'PENDING' | 'ISSUED' | 'REVOKED' | undefined {
  switch (status) {
    case 'eligible':
      return 'ELIGIBLE';
    case 'pending':
      return 'PENDING';
    case 'issued':
      return 'ISSUED';
    case 'revoked':
      return 'REVOKED';
    default:
      return undefined;
  }
}

export function toLiveSessionApiStatus(
  status: StudentLiveStatusFilter,
): 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | undefined {
  switch (status) {
    case 'scheduled':
      return 'SCHEDULED';
    case 'live':
      return 'LIVE';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return undefined;
  }
}

export function toAssignmentApiStatus(
  status: StudentAssignmentStatusFilter,
): 'PUBLISHED' | 'CLOSED' | undefined {
  switch (status) {
    case 'published':
      return 'PUBLISHED';
    case 'closed':
      return 'CLOSED';
    default:
      return undefined;
  }
}
