import { Inject, Injectable } from '@nestjs/common';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { StorageService } from '../../storage/services/storage.service';
import { COURSE_REPOSITORY } from '../constants/injection-tokens';
import type { CourseResponseDto, PaginatedCoursesResponseDto } from '../dto/course-response.dto';
import type { CreateCourseDto } from '../dto/create-course.dto';
import type { ListCoursesQueryDto } from '../dto/list-courses-query.dto';
import type { UpdateCourseDto } from '../dto/update-course.dto';
import {
  CourseForbiddenException,
  CourseMutationForbiddenException,
  CourseNotFoundException,
  CourseOrganizationAccessException,
  CourseSlugConflictException,
  CourseTeacherProfileRequiredException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type { CourseRecord, CourseRepository } from '../interfaces/course-repository.interface';
import { CourseMapper } from '../mappers/course.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class CourseService {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: CourseRepository,
    private readonly storageService?: StorageService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListCoursesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedCoursesResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let enrolledStudentId: string | undefined;
    if (this.isStudentOnly(user)) {
      enrolledStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
    }

    const result = await this.courseRepository.findMany({
      organizationId,
      search: query.search,
      status: query.status,
      difficulty: query.difficulty,
      language: query.language,
      enrolledStudentId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

    return {
      message: 'Courses retrieved successfully.',
      data: {
        items: CourseMapper.toResponseList(result.items),
        meta: {
          total: result.total,
          page: query.page,
          limit: query.limit,
          totalPages,
        },
      },
    };
  }

  async getById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<CourseResponseDto>> {
    const course = await this.requireAccessibleCourse(user, id);

    return {
      message: 'Course retrieved successfully.',
      data: CourseMapper.toResponse(course),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateCourseDto,
  ): Promise<ControllerSuccessPayload<CourseResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const teacherId = await this.resolveTeacherIdForCreate(user, dto);

    await this.assertSlugAvailable(dto.organizationId, dto.slug);
    const [thumbnailUrl, bannerUrl] = await Promise.all([
      this.resolveMedia(dto.thumbnailUrl, dto.organizationId, 'COURSE_THUMBNAIL'),
      this.resolveMedia(dto.bannerUrl, dto.organizationId, 'COURSE_BANNER'),
    ]);

    try {
      const course = await this.courseRepository.create({
        organizationId: dto.organizationId,
        teacherId,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        thumbnailUrl: thumbnailUrl ?? undefined,
        bannerUrl: bannerUrl ?? undefined,
        difficulty: dto.difficulty,
        status: dto.status,
        language: dto.language,
      });

      return {
        message: 'Course created successfully.',
        data: CourseMapper.toResponse(course),
      };
    } catch (error: unknown) {
      this.rethrowSlugConflict(error);
      throw error;
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCourseDto,
  ): Promise<ControllerSuccessPayload<CourseResponseDto>> {
    const course = await this.requireAccessibleCourse(user, id);
    await this.assertCanMutateCourse(user, course);

    if (dto.teacherId !== undefined) {
      const exists = await this.courseRepository.teacherProfileExistsInOrganization(
        course.organizationId,
        dto.teacherId,
      );
      if (!exists) {
        throw new CourseTeacherProfileRequiredException(
          'The specified teacher profile was not found in this organization.',
        );
      }
    }

    if (dto.slug !== undefined && dto.slug !== course.slug) {
      await this.assertSlugAvailable(course.organizationId, dto.slug);
    }
    const [thumbnailUrl, bannerUrl] = await Promise.all([
      this.resolveMedia(dto.thumbnailUrl, course.organizationId, 'COURSE_THUMBNAIL'),
      this.resolveMedia(dto.bannerUrl, course.organizationId, 'COURSE_BANNER'),
    ]);

    try {
      const updated = await this.courseRepository.update(id, {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        thumbnailUrl,
        bannerUrl,
        difficulty: dto.difficulty,
        status: dto.status,
        language: dto.language,
        teacherId: dto.teacherId,
      });

      return {
        message: 'Course updated successfully.',
        data: CourseMapper.toResponse(updated),
      };
    } catch (error: unknown) {
      this.rethrowSlugConflict(error);
      throw error;
    }
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<CourseResponseDto>> {
    const course = await this.requireAccessibleCourse(user, id);
    await this.assertCanMutateCourse(user, course);

    const deleted = await this.courseRepository.softDelete(id);

    return {
      message: 'Course deleted successfully.',
      data: CourseMapper.toResponse(deleted),
    };
  }

  private resolveOrganizationId(user: AuthenticatedUser, organizationId?: string): string {
    if (organizationId) {
      this.assertOrganizationAccess(user, organizationId);
      return organizationId;
    }

    if (user.organizationIds.length === 1) {
      const [onlyOrganizationId] = user.organizationIds;
      if (onlyOrganizationId) {
        return onlyOrganizationId;
      }
    }

    throw new CourseOrganizationAccessException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new CourseOrganizationAccessException();
    }
  }

  private async requireAccessibleCourse(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CourseRecord> {
    const course = await this.courseRepository.findById(id);

    if (course?.deletedAt !== null) {
      throw new CourseNotFoundException();
    }

    this.assertOrganizationAccess(user, course.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(course.organizationId, user.id);
      const enrolled = await this.courseRepository.isStudentEnrolledInCourse(
        course.id,
        ownStudentId,
      );
      if (!enrolled) {
        throw new CourseForbiddenException();
      }
    }

    return course;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.courseRepository.findStudentProfileId(
      organizationId,
      userId,
    );

    if (!studentProfileId) {
      throw new StudentProfileNotFoundException();
    }

    return studentProfileId;
  }

  private async assertCanMutateCourse(
    user: AuthenticatedUser,
    course: CourseRecord,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const ownProfileId = await this.courseRepository.findTeacherProfileId(
      course.organizationId,
      user.id,
    );

    if (!ownProfileId || ownProfileId !== course.teacherId) {
      throw new CourseMutationForbiddenException();
    }
  }

  private async resolveTeacherIdForCreate(
    user: AuthenticatedUser,
    dto: CreateCourseDto,
  ): Promise<string> {
    if (dto.teacherId) {
      const exists = await this.courseRepository.teacherProfileExistsInOrganization(
        dto.organizationId,
        dto.teacherId,
      );
      if (!exists) {
        throw new CourseTeacherProfileRequiredException(
          'The specified teacher profile was not found in this organization.',
        );
      }

      if (
        !user.roles.includes(AUTH_ROLES.admin) &&
        !(await this.isOwnTeacherProfile(user, dto.organizationId, dto.teacherId))
      ) {
        throw new CourseMutationForbiddenException(
          'You may only create courses under your own teacher profile.',
        );
      }

      return dto.teacherId;
    }

    const ownProfileId = await this.courseRepository.findTeacherProfileId(
      dto.organizationId,
      user.id,
    );

    if (!ownProfileId) {
      throw new CourseTeacherProfileRequiredException();
    }

    return ownProfileId;
  }

  private async isOwnTeacherProfile(
    user: AuthenticatedUser,
    organizationId: string,
    teacherProfileId: string,
  ): Promise<boolean> {
    const ownProfileId = await this.courseRepository.findTeacherProfileId(organizationId, user.id);
    return ownProfileId === teacherProfileId;
  }

  private async assertSlugAvailable(organizationId: string, slug: string): Promise<void> {
    const existing = await this.courseRepository.findByOrganizationSlug(organizationId, slug);
    if (existing) {
      throw new CourseSlugConflictException();
    }
  }

  private rethrowSlugConflict(error: unknown): void {
    if (isPrismaUniqueConflict(error)) {
      throw new CourseSlugConflictException();
    }
  }

  private async resolveMedia(
    reference: string | null | undefined,
    organizationId: string,
    entityType: 'COURSE_THUMBNAIL' | 'COURSE_BANNER',
  ): Promise<string | null | undefined> {
    if (reference === undefined || reference === null) return reference;
    if (!this.storageService) {
      throw new CourseMutationForbiddenException('Storage service is unavailable.');
    }
    return this.storageService.resolveAssetUrl(reference, { organizationId, entityType });
  }
}
