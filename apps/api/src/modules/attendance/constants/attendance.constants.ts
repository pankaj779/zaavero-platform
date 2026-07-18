export const ATTENDANCE_SORT_FIELDS = ['createdAt', 'updatedAt', 'markedAt', 'status'] as const;

export type AttendanceSortField = (typeof ATTENDANCE_SORT_FIELDS)[number];

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;

export type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_DEFAULT_PAGE = 1;
export const ATTENDANCE_DEFAULT_LIMIT = 20;
export const ATTENDANCE_MAX_LIMIT = 100;
