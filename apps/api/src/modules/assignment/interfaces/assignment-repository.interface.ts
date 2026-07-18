import type { AssignmentSortField, AssignmentStatusValue } from '../constants/assignment.constants';

export interface AssignmentRecord {
  id: string;
  organizationId: string;
  courseId: string;
  batchId: string | null;
  title: string;
  instructions: string | null;
  status: AssignmentStatusValue;
  maxScore: number | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AssignmentListFilters {
  organizationId: string;
  courseId?: string;
  batchId?: string;
  status?: AssignmentStatusValue;
  search?: string;
  /**
   * Restricts results to student-visible assignments: PUBLISHED/CLOSED only,
   * scoped to the student's enrolled course (course-wide assignments) or
   * enrolled batch (batch-specific assignments).
   */
  enrolledStudentId?: string;
  page: number;
  limit: number;
  sortBy: AssignmentSortField;
  sortOrder: 'asc' | 'desc';
}

export interface AssignmentListResult {
  items: AssignmentRecord[];
  total: number;
}

export interface CreateAssignmentData {
  organizationId: string;
  courseId: string;
  batchId?: string | null;
  title: string;
  instructions?: string | null;
  status?: AssignmentStatusValue;
  maxScore?: number | null;
  dueAt?: Date | null;
}

export interface UpdateAssignmentData {
  title?: string;
  instructions?: string | null;
  status?: AssignmentStatusValue;
  maxScore?: number | null;
  dueAt?: Date | null;
  batchId?: string | null;
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

export interface AssignmentRepository {
  readonly marker: 'assignment-repository';

  findById(id: string): Promise<AssignmentRecord | null>;

  findMany(filters: AssignmentListFilters): Promise<AssignmentListResult>;

  findCourseContext(courseId: string): Promise<CourseContextRecord | null>;

  findBatchContext(batchId: string): Promise<BatchContextRecord | null>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  studentHasAccessToAssignment(assignmentId: string, studentProfileId: string): Promise<boolean>;

  create(data: CreateAssignmentData): Promise<AssignmentRecord>;

  update(id: string, data: UpdateAssignmentData): Promise<AssignmentRecord>;

  softDelete(id: string): Promise<AssignmentRecord>;
}
