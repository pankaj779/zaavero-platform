import type { BatchSortField, BatchStatusValue } from '../constants/batch.constants';

export interface BatchRecord {
  id: string;
  organizationId: string;
  courseId: string;
  teacherId: string;
  name: string;
  status: BatchStatusValue;
  startDate: Date;
  endDate: Date | null;
  maxStudents: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface BatchListFilters {
  organizationId: string;
  search?: string;
  status?: BatchStatusValue;
  courseId?: string;
  teacherId?: string;
  /** Restricts results to batches with a non-dropped enrollment for this student profile. */
  enrolledStudentId?: string;
  page: number;
  limit: number;
  sortBy: BatchSortField;
  sortOrder: 'asc' | 'desc';
}

export interface BatchListResult {
  items: BatchRecord[];
  total: number;
}

export interface CreateBatchData {
  organizationId: string;
  courseId: string;
  teacherId: string;
  name: string;
  status?: BatchStatusValue;
  startDate: Date;
  endDate?: Date;
  maxStudents?: number;
}

export interface UpdateBatchData {
  name?: string;
  status?: BatchStatusValue;
  startDate?: Date;
  endDate?: Date | null;
  maxStudents?: number | null;
  teacherId?: string;
}

export interface BatchRepository {
  readonly marker: 'batch-repository';

  findById(id: string): Promise<BatchRecord | null>;

  findMany(filters: BatchListFilters): Promise<BatchListResult>;

  findByCourseName(courseId: string, name: string): Promise<BatchRecord | null>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  teacherProfileExistsInOrganization(
    organizationId: string,
    teacherProfileId: string,
  ): Promise<boolean>;

  courseExistsInOrganization(organizationId: string, courseId: string): Promise<boolean>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  isStudentEnrolledInBatch(batchId: string, studentProfileId: string): Promise<boolean>;

  create(data: CreateBatchData): Promise<BatchRecord>;

  update(id: string, data: UpdateBatchData): Promise<BatchRecord>;

  softDelete(id: string): Promise<BatchRecord>;
}
