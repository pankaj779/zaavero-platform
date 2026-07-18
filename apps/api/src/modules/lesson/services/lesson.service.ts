import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { StorageService } from '../../storage/services/storage.service';
import type { LessonContentTypeValue } from '../constants/lesson.constants';
import { LESSON_REPOSITORY } from '../constants/injection-tokens';
import type { LessonResponseDto, PaginatedLessonsResponseDto } from '../dto/lesson-response.dto';
import type { CreateLessonDto } from '../dto/create-lesson.dto';
import type { ListLessonsQueryDto } from '../dto/list-lessons-query.dto';
import type { UpdateLessonDto } from '../dto/update-lesson.dto';
import {
  InvalidLessonException,
  LessonForbiddenException,
  LessonNotFoundException,
  ModuleNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherLessonMutationForbiddenException,
} from '../exceptions';
import type {
  LessonRecord,
  LessonRepository,
  ModuleContextRecord,
} from '../interfaces/lesson-repository.interface';
import { LessonMapper } from '../mappers/lesson.mapper';

@Injectable()
export class LessonService {
  constructor(
    @Inject(LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
    private readonly storageService?: StorageService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListLessonsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedLessonsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let enrolledStudentId: string | undefined;
    if (this.isStudentOnly(user)) {
      enrolledStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
    }

    const result = await this.lessonRepository.findMany({
      organizationId,
      moduleId: query.moduleId,
      courseId: query.courseId,
      contentType: query.contentType,
      search: query.search,
      enrolledStudentId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Lessons retrieved successfully.',
      data: {
        items: LessonMapper.toResponseList(result.items),
        meta: buildPageMeta({
          total: result.total,
          page: query.page,
          limit: query.limit,
        }),
      },
    };
  }

  async getById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<LessonResponseDto>> {
    const lesson = await this.requireAccessibleLesson(user, id);
    return {
      message: 'Lesson retrieved successfully.',
      data: LessonMapper.toResponse(lesson),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateLessonDto,
  ): Promise<ControllerSuccessPayload<LessonResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);
    const module = await this.requireModuleInOrganization(dto.organizationId, dto.moduleId);
    await this.assertCanMutateCourseLessons(user, dto.organizationId, module.courseId);

    if (dto.durationSeconds !== undefined && dto.durationSeconds < 0) {
      throw new InvalidLessonException('durationSeconds must be >= 0.');
    }
    const contentUrl = await this.resolveContentUrl(
      dto.contentUrl,
      dto.contentType ?? 'VIDEO',
      dto.organizationId,
    );

    const lesson = await this.lessonRepository.create({
      organizationId: dto.organizationId,
      moduleId: dto.moduleId,
      title: dto.title,
      description: dto.description,
      contentType: dto.contentType,
      contentUrl: contentUrl ?? undefined,
      durationSeconds: dto.durationSeconds,
      displayOrder: dto.displayOrder,
    });

    return {
      message: 'Lesson created successfully.',
      data: LessonMapper.toResponse(lesson),
    };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateLessonDto,
  ): Promise<ControllerSuccessPayload<LessonResponseDto>> {
    const lesson = await this.requireAccessibleLesson(user, id);
    const module = await this.requireModuleInOrganization(lesson.organizationId, lesson.moduleId);
    await this.assertCanMutateCourseLessons(user, lesson.organizationId, module.courseId);
    const contentUrl = await this.resolveContentUrl(
      dto.contentUrl,
      dto.contentType ?? lesson.contentType,
      lesson.organizationId,
    );

    const updated = await this.lessonRepository.update(id, {
      title: dto.title,
      description: dto.description,
      contentType: dto.contentType,
      contentUrl,
      durationSeconds: dto.durationSeconds,
      displayOrder: dto.displayOrder,
    });

    return {
      message: 'Lesson updated successfully.',
      data: LessonMapper.toResponse(updated),
    };
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<LessonResponseDto>> {
    const lesson = await this.requireAccessibleLesson(user, id);
    const module = await this.requireModuleInOrganization(lesson.organizationId, lesson.moduleId);
    await this.assertCanMutateCourseLessons(user, lesson.organizationId, module.courseId);

    const deleted = await this.lessonRepository.softDelete(id);
    return {
      message: 'Lesson deleted successfully.',
      data: LessonMapper.toResponse(deleted),
    };
  }

  private resolveOrganizationId(user: AuthenticatedUser, organizationId?: string): string {
    if (organizationId) {
      this.assertOrganizationAccess(user, organizationId);
      return organizationId;
    }
    if (user.organizationIds.length === 1) {
      const [onlyOrganizationId] = user.organizationIds;
      if (onlyOrganizationId) return onlyOrganizationId;
    }
    throw new OrganizationAccessDeniedException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new OrganizationAccessDeniedException();
    }
  }

  private async requireAccessibleLesson(
    user: AuthenticatedUser,
    id: string,
  ): Promise<LessonRecord> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new LessonNotFoundException();
    this.assertOrganizationAccess(user, lesson.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(lesson.organizationId, user.id);
      const hasAccess = await this.lessonRepository.studentHasAccessToLesson(
        lesson.id,
        ownStudentId,
      );
      if (!hasAccess) throw new LessonForbiddenException();
    }

    return lesson;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.lessonRepository.findStudentProfileId(
      organizationId,
      userId,
    );
    if (!studentProfileId) throw new StudentProfileNotFoundException();
    return studentProfileId;
  }

  private async requireModuleInOrganization(
    organizationId: string,
    moduleId: string,
  ): Promise<ModuleContextRecord> {
    const module = await this.lessonRepository.findModuleContext(moduleId);
    if (module?.organizationId !== organizationId) {
      throw new ModuleNotFoundException();
    }
    return module;
  }

  private async assertCanMutateCourseLessons(
    user: AuthenticatedUser,
    organizationId: string,
    courseId: string,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) return;

    const teacherId = await this.lessonRepository.findCourseTeacherId(courseId);
    const ownProfileId = await this.lessonRepository.findTeacherProfileId(organizationId, user.id);

    if (!ownProfileId || !teacherId || ownProfileId !== teacherId) {
      throw new TeacherLessonMutationForbiddenException();
    }
  }

  private async resolveContentUrl(
    reference: string | null | undefined,
    contentType: LessonContentTypeValue,
    organizationId: string,
  ): Promise<string | null | undefined> {
    if (reference === undefined || reference === null) return reference;
    const entityType =
      contentType === 'VIDEO' ? 'LESSON_VIDEO' : contentType === 'PDF' ? 'LESSON_PDF' : undefined;
    if (!entityType) return reference;
    if (!this.storageService) {
      throw new InvalidLessonException('Storage service is unavailable.');
    }
    return this.storageService.resolveAssetUrl(reference, { organizationId, entityType });
  }
}
