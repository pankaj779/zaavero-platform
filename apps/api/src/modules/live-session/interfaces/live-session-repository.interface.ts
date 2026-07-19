import type {
  LiveSessionSortField,
  LiveSessionStatusValue,
  MeetingProviderValue,
} from '../constants/live-session.constants';

export type MeetingSyncStatusValue = 'IDLE' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface LiveSessionRecord {
  id: string;
  organizationId: string;
  batchId: string;
  meetingIntegrationId: string | null;
  title: string;
  description: string | null;
  status: LiveSessionStatusValue;
  meetingProvider: MeetingProviderValue;
  providerMeetingId: string | null;
  meetingUrl: string | null;
  hostUrlEncrypted: string | null;
  recordingUrl: string | null;
  timezone: string;
  recurrenceRule: string | null;
  syncStatus: MeetingSyncStatusValue;
  syncError: string | null;
  startsAt: Date;
  endsAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface LiveSessionListFilters {
  organizationId: string;
  batchId?: string;
  status?: LiveSessionStatusValue;
  meetingProvider?: MeetingProviderValue;
  search?: string;
  /** Restricts results to sessions of batches with a non-dropped enrollment for this student profile. */
  enrolledStudentId?: string;
  page: number;
  limit: number;
  sortBy: LiveSessionSortField;
  sortOrder: 'asc' | 'desc';
}
export interface LiveSessionListResult {
  items: LiveSessionRecord[];
  total: number;
}
export interface CreateLiveSessionData {
  organizationId: string;
  batchId: string;
  title: string;
  description?: string;
  status?: LiveSessionStatusValue;
  meetingProvider?: MeetingProviderValue;
  meetingUrl?: string;
  recordingUrl?: string;
  timezone?: string;
  recurrenceRule?: string;
  startsAt: Date;
  endsAt?: Date;
  createdById?: string;
}
export interface UpdateLiveSessionData {
  title?: string;
  description?: string | null;
  status?: LiveSessionStatusValue;
  meetingProvider?: MeetingProviderValue;
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  timezone?: string;
  recurrenceRule?: string | null;
  startsAt?: Date;
  endsAt?: Date | null;
  updatedById?: string;
}
export interface BatchContextRecord {
  id: string;
  organizationId: string;
  teacherId: string;
}
export interface LiveSessionRepository {
  readonly marker: 'live-session-repository';
  findById(id: string): Promise<LiveSessionRecord | null>;
  findMany(filters: LiveSessionListFilters): Promise<LiveSessionListResult>;
  findBatchContext(batchId: string): Promise<BatchContextRecord | null>;
  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;
  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;
  isStudentEnrolledInBatch(batchId: string, studentProfileId: string): Promise<boolean>;
  create(data: CreateLiveSessionData): Promise<LiveSessionRecord>;
  update(id: string, data: UpdateLiveSessionData): Promise<LiveSessionRecord>;
  softDelete(id: string): Promise<LiveSessionRecord>;
}
