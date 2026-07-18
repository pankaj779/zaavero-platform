import type { CalendarProviderValue, CalendarSortField } from '../constants/calendar.constants';

export interface CalendarEventRecord {
  id: string;
  organizationId: string;
  courseId: string | null;
  batchId: string | null;
  liveSessionId: string | null;
  assignmentId: string | null;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  externalProvider: CalendarProviderValue;
  externalEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CalendarEventListFilters {
  organizationId: string;
  courseId?: string;
  batchId?: string;
  liveSessionId?: string;
  assignmentId?: string;
  from?: Date;
  to?: Date;
  search?: string;
  /**
   * Restricts results to events tied to the student's non-dropped enrollments:
   * enrolled courses/batches, live sessions of enrolled batches, and
   * PUBLISHED/CLOSED assignments visible to the student. Events without any
   * course/batch/liveSession/assignment link are excluded because the schema
   * has no explicit organization-wide audience marker.
   */
  enrolledStudentId?: string;
  page: number;
  limit: number;
  sortBy: CalendarSortField;
  sortOrder: 'asc' | 'desc';
}

export interface CalendarEventListResult {
  items: CalendarEventRecord[];
  total: number;
}

export interface CreateCalendarEventData {
  organizationId: string;
  courseId?: string | null;
  batchId?: string | null;
  liveSessionId?: string | null;
  assignmentId?: string | null;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  allDay?: boolean;
  externalProvider?: CalendarProviderValue;
  externalEventId?: string | null;
}

export interface UpdateCalendarEventData {
  courseId?: string | null;
  batchId?: string | null;
  liveSessionId?: string | null;
  assignmentId?: string | null;
  title?: string;
  description?: string | null;
  startsAt?: Date;
  endsAt?: Date | null;
  allDay?: boolean;
  externalProvider?: CalendarProviderValue;
  externalEventId?: string | null;
}

export interface CourseContextRecord {
  id: string;
  organizationId: string;
  teacherId: string;
}

export interface BatchContextRecord {
  id: string;
  organizationId: string;
  courseId: string;
  teacherId: string;
}

export interface LiveSessionContextRecord {
  id: string;
  organizationId: string;
}

export interface AssignmentContextRecord {
  id: string;
  organizationId: string;
}

export interface CalendarRepository {
  readonly marker: 'calendar-repository';

  findById(id: string): Promise<CalendarEventRecord | null>;

  findMany(filters: CalendarEventListFilters): Promise<CalendarEventListResult>;

  findCourseContext(courseId: string): Promise<CourseContextRecord | null>;

  findBatchContext(batchId: string): Promise<BatchContextRecord | null>;

  findLiveSessionContext(liveSessionId: string): Promise<LiveSessionContextRecord | null>;

  findAssignmentContext(assignmentId: string): Promise<AssignmentContextRecord | null>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  teacherExistsInOrganization(organizationId: string, userId: string): Promise<boolean>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  studentHasAccessToEvent(eventId: string, studentProfileId: string): Promise<boolean>;

  create(data: CreateCalendarEventData): Promise<CalendarEventRecord>;

  update(id: string, data: UpdateCalendarEventData): Promise<CalendarEventRecord>;

  softDelete(id: string): Promise<CalendarEventRecord>;
}
