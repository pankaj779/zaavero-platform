import type {
  CourseDifficultyValue,
  CourseSortField,
  CourseStatusValue,
} from '../constants/course.constants';

export interface CourseRecord {
  id: string;
  organizationId: string;
  teacherId: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  difficulty: CourseDifficultyValue;
  status: CourseStatusValue;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CourseListFilters {
  organizationId: string;
  search?: string;
  status?: CourseStatusValue;
  difficulty?: CourseDifficultyValue;
  language?: string;
  /** Restricts results to courses with a non-dropped enrollment for this student profile. */
  enrolledStudentId?: string;
  page: number;
  limit: number;
  sortBy: CourseSortField;
  sortOrder: 'asc' | 'desc';
}

export interface CourseListResult {
  items: CourseRecord[];
  total: number;
}

export interface CreateCourseData {
  organizationId: string;
  teacherId: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  difficulty?: CourseDifficultyValue;
  status?: CourseStatusValue;
  language?: string;
}

export interface UpdateCourseData {
  title?: string;
  slug?: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  difficulty?: CourseDifficultyValue;
  status?: CourseStatusValue;
  language?: string;
  teacherId?: string;
}

export interface CourseRepository {
  readonly marker: 'course-repository';

  findById(id: string): Promise<CourseRecord | null>;

  findMany(filters: CourseListFilters): Promise<CourseListResult>;

  findByOrganizationSlug(organizationId: string, slug: string): Promise<CourseRecord | null>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  teacherProfileExistsInOrganization(
    organizationId: string,
    teacherProfileId: string,
  ): Promise<boolean>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  isStudentEnrolledInCourse(courseId: string, studentProfileId: string): Promise<boolean>;

  create(data: CreateCourseData): Promise<CourseRecord>;

  update(id: string, data: UpdateCourseData): Promise<CourseRecord>;

  softDelete(id: string): Promise<CourseRecord>;
}
