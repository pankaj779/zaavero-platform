import type { LessonContentTypeValue, LessonSortField } from '../constants/lesson.constants';

export interface LessonRecord {
  id: string;
  organizationId: string;
  moduleId: string;
  title: string;
  description: string | null;
  contentType: LessonContentTypeValue;
  contentUrl: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonListFilters {
  organizationId: string;
  moduleId?: string;
  courseId?: string;
  contentType?: LessonContentTypeValue;
  search?: string;
  /** Restricts results to lessons whose module course has a non-dropped enrollment for this student profile. */
  enrolledStudentId?: string;
  page: number;
  limit: number;
  sortBy: LessonSortField;
  sortOrder: 'asc' | 'desc';
}

export interface LessonListResult {
  items: LessonRecord[];
  total: number;
}

export interface CreateLessonData {
  organizationId: string;
  moduleId: string;
  title: string;
  description?: string;
  contentType?: LessonContentTypeValue;
  contentUrl?: string;
  durationSeconds?: number;
  displayOrder?: number;
}

export interface UpdateLessonData {
  title?: string;
  description?: string | null;
  contentType?: LessonContentTypeValue;
  contentUrl?: string | null;
  durationSeconds?: number | null;
  displayOrder?: number;
}

export interface ModuleContextRecord {
  id: string;
  organizationId: string;
  courseId: string;
}

export interface LessonRepository {
  readonly marker: 'lesson-repository';

  findById(id: string): Promise<LessonRecord | null>;
  findMany(filters: LessonListFilters): Promise<LessonListResult>;
  findModuleContext(moduleId: string): Promise<ModuleContextRecord | null>;
  findCourseTeacherId(courseId: string): Promise<string | null>;
  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;
  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;
  studentHasAccessToLesson(lessonId: string, studentProfileId: string): Promise<boolean>;
  create(data: CreateLessonData): Promise<LessonRecord>;
  update(id: string, data: UpdateLessonData): Promise<LessonRecord>;
  softDelete(id: string): Promise<LessonRecord>;
}
