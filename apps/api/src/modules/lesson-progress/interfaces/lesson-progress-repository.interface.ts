import type {
  LessonProgressSortField,
  LessonProgressStatusValue,
} from '../constants/lesson-progress.constants';

export interface LessonProgressRecord {
  id: string;
  organizationId: string;
  lessonId: string;
  studentId: string;
  status: LessonProgressStatusValue;
  progressPercent: number;
  lastPositionSeconds: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface LessonProgressListFilters {
  organizationId: string;
  lessonId?: string;
  studentId?: string;
  status?: LessonProgressStatusValue;
  page: number;
  limit: number;
  sortBy: LessonProgressSortField;
  sortOrder: 'asc' | 'desc';
}
export interface LessonProgressListResult {
  items: LessonProgressRecord[];
  total: number;
}
export interface CreateLessonProgressData {
  organizationId: string;
  lessonId: string;
  studentId: string;
  status?: LessonProgressStatusValue;
  progressPercent?: number;
  lastPositionSeconds?: number;
  completedAt?: Date | null;
}
export interface UpdateLessonProgressData {
  status?: LessonProgressStatusValue;
  progressPercent?: number;
  lastPositionSeconds?: number | null;
  completedAt?: Date | null;
}
export interface LessonProgressRepository {
  readonly marker: 'lesson-progress-repository';
  findById(id: string): Promise<LessonProgressRecord | null>;
  findMany(filters: LessonProgressListFilters): Promise<LessonProgressListResult>;
  findByLessonAndStudent(lessonId: string, studentId: string): Promise<LessonProgressRecord | null>;
  lessonExistsInOrganization(organizationId: string, lessonId: string): Promise<boolean>;
  studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean>;
  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;
  create(data: CreateLessonProgressData): Promise<LessonProgressRecord>;
  update(id: string, data: UpdateLessonProgressData): Promise<LessonProgressRecord>;
}
