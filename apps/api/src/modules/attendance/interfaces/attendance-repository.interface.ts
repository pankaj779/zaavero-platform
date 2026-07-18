import type { AttendanceSortField, AttendanceStatusValue } from '../constants/attendance.constants';

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  liveSessionId: string;
  studentId: string;
  status: AttendanceStatusValue;
  markedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceListFilters {
  organizationId: string;
  liveSessionId?: string;
  studentId?: string;
  status?: AttendanceStatusValue;
  page: number;
  limit: number;
  sortBy: AttendanceSortField;
  sortOrder: 'asc' | 'desc';
}

export interface AttendanceListResult {
  items: AttendanceRecord[];
  total: number;
}

export interface CreateAttendanceData {
  organizationId: string;
  liveSessionId: string;
  studentId: string;
  status?: AttendanceStatusValue;
  markedAt?: Date | null;
  notes?: string | null;
}

export interface UpdateAttendanceData {
  status?: AttendanceStatusValue;
  markedAt?: Date | null;
  notes?: string | null;
}

export interface LiveSessionContextRecord {
  id: string;
  organizationId: string;
  batchId: string;
  batchTeacherId: string;
}

export interface AttendanceRepository {
  readonly marker: 'attendance-repository';

  findById(id: string): Promise<AttendanceRecord | null>;

  findMany(filters: AttendanceListFilters): Promise<AttendanceListResult>;

  findByLiveSessionAndStudent(
    liveSessionId: string,
    studentId: string,
  ): Promise<AttendanceRecord | null>;

  findLiveSessionContext(liveSessionId: string): Promise<LiveSessionContextRecord | null>;

  studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  create(data: CreateAttendanceData): Promise<AttendanceRecord>;

  update(id: string, data: UpdateAttendanceData): Promise<AttendanceRecord>;
}
