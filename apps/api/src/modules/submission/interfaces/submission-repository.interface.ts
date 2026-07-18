import type { SubmissionSortField, SubmissionStatusValue } from '../constants/submission.constants';

export interface SubmissionRecord {
  id: string;
  organizationId: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatusValue;
  content: string | null;
  attachments: string[];
  score: number | null;
  feedback: string | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  gradedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentContextRecord {
  id: string;
  organizationId: string;
  courseId: string;
  maxScore: number | null;
  dueAt: Date | null;
  deletedAt: Date | null;
}

export interface CourseContextRecord {
  id: string;
  organizationId: string;
  teacherId: string;
}

export interface SubmissionListFilters {
  organizationId: string;
  assignmentId?: string;
  studentId?: string;
  status?: SubmissionStatusValue;
  page: number;
  limit: number;
  sortBy: SubmissionSortField;
  sortOrder: 'asc' | 'desc';
}

export interface SubmissionListResult {
  items: SubmissionRecord[];
  total: number;
}

export interface CreateSubmissionData {
  organizationId: string;
  assignmentId: string;
  studentId: string;
  status?: SubmissionStatusValue;
  content?: string | null;
  attachments?: string[];
  submittedAt?: Date | null;
}

export interface UpdateSubmissionData {
  status?: SubmissionStatusValue;
  content?: string | null;
  attachments?: string[];
  score?: number | null;
  feedback?: string | null;
  submittedAt?: Date | null;
  gradedAt?: Date | null;
  gradedById?: string | null;
}

export interface SubmissionRepository {
  readonly marker: 'submission-repository';

  findById(id: string): Promise<SubmissionRecord | null>;

  findMany(filters: SubmissionListFilters): Promise<SubmissionListResult>;

  findByAssignmentAndStudent(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionRecord | null>;

  findAssignmentContext(assignmentId: string): Promise<AssignmentContextRecord | null>;

  findCourseContext(courseId: string): Promise<CourseContextRecord | null>;

  studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  create(data: CreateSubmissionData): Promise<SubmissionRecord>;

  update(id: string, data: UpdateSubmissionData): Promise<SubmissionRecord>;
}
