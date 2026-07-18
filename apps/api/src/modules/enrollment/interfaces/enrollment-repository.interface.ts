import type { EnrollmentSortField, EnrollmentStatusValue } from '../constants/enrollment.constants';

export interface EnrollmentRecord {
  id: string;
  organizationId: string;
  courseId: string;
  batchId: string;
  studentId: string;
  status: EnrollmentStatusValue;
  enrolledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentListFilters {
  organizationId: string;
  batchId?: string;
  courseId?: string;
  studentId?: string;
  status?: EnrollmentStatusValue;
  /** Always excludes DROPPED rows even when a status filter is provided. */
  excludeDropped?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: EnrollmentSortField;
  sortOrder: 'asc' | 'desc';
}

export interface EnrollmentListResult {
  items: EnrollmentRecord[];
  total: number;
}

export interface CreateEnrollmentData {
  organizationId: string;
  courseId: string;
  batchId: string;
  studentId: string;
  status?: EnrollmentStatusValue;
}

export interface UpdateEnrollmentData {
  status?: EnrollmentStatusValue;
  completedAt?: Date | null;
}

export interface BatchContextRecord {
  id: string;
  organizationId: string;
  courseId: string;
  teacherId: string;
}

export interface EnrollmentRepository {
  readonly marker: 'enrollment-repository';

  findById(id: string): Promise<EnrollmentRecord | null>;

  findMany(filters: EnrollmentListFilters): Promise<EnrollmentListResult>;

  findByBatchAndStudent(batchId: string, studentId: string): Promise<EnrollmentRecord | null>;

  findBatchContext(batchId: string): Promise<BatchContextRecord | null>;

  courseExistsInOrganization(organizationId: string, courseId: string): Promise<boolean>;

  studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  create(data: CreateEnrollmentData): Promise<EnrollmentRecord>;

  update(id: string, data: UpdateEnrollmentData): Promise<EnrollmentRecord>;

  softDelete(id: string): Promise<EnrollmentRecord>;
}
