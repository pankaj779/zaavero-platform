import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import { isPrismaUniqueConflict } from '../../../common/prisma';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { LESSON_PROGRESS_REPOSITORY } from '../constants/injection-tokens';
import type {
  LessonProgressResponseDto,
  PaginatedLessonProgressResponseDto,
} from '../dto/lesson-progress-response.dto';
import type { CreateLessonProgressDto } from '../dto/create-lesson-progress.dto';
import type { ListLessonProgressQueryDto } from '../dto/list-lesson-progress-query.dto';
import type { UpdateLessonProgressDto } from '../dto/update-lesson-progress.dto';
import {
  InvalidLessonProgressException,
  LessonNotFoundException,
  LessonProgressConflictException,
  LessonProgressForbiddenException,
  LessonProgressNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type {
  LessonProgressRecord,
  LessonProgressRepository,
} from '../interfaces/lesson-progress-repository.interface';
import { LessonProgressMapper } from '../mappers/lesson-progress.mapper';

@Injectable()
export class LessonProgressService {
  constructor(
    @Inject(LESSON_PROGRESS_REPOSITORY) private readonly repo: LessonProgressRepository,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListLessonProgressQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedLessonProgressResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    let studentId = query.studentId;
    if (this.isStudentOnly(user)) {
      const own = await this.requireOwnStudentProfile(organizationId, user.id);
      studentId = own;
    }
    const result = await this.repo.findMany({
      organizationId,
      lessonId: query.lessonId,
      studentId,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      message: 'Lesson progress retrieved successfully.',
      data: {
        items: LessonProgressMapper.toResponseList(result.items),
        meta: buildPageMeta({ total: result.total, page: query.page, limit: query.limit }),
      },
    };
  }

  async getById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<LessonProgressResponseDto>> {
    const row = await this.requireAccessible(user, id);
    return {
      message: 'Lesson progress retrieved successfully.',
      data: LessonProgressMapper.toResponse(row),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateLessonProgressDto,
  ): Promise<ControllerSuccessPayload<LessonProgressResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);
    const lessonOk = await this.repo.lessonExistsInOrganization(dto.organizationId, dto.lessonId);
    if (!lessonOk) throw new LessonNotFoundException();

    const studentId = await this.resolveStudentIdForWrite(user, dto.organizationId, dto.studentId);
    const existing = await this.repo.findByLessonAndStudent(dto.lessonId, studentId);
    if (existing) throw new LessonProgressConflictException();

    const { status, progressPercent, completedAt } = this.normalizeProgress(
      dto.status,
      dto.progressPercent,
      null,
    );
    try {
      const created = await this.repo.create({
        organizationId: dto.organizationId,
        lessonId: dto.lessonId,
        studentId,
        status,
        progressPercent,
        lastPositionSeconds: dto.lastPositionSeconds,
        completedAt,
      });
      return {
        message: 'Lesson progress created successfully.',
        data: LessonProgressMapper.toResponse(created),
      };
    } catch (error: unknown) {
      if (isPrismaUniqueConflict(error)) throw new LessonProgressConflictException();
      throw error;
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateLessonProgressDto,
  ): Promise<ControllerSuccessPayload<LessonProgressResponseDto>> {
    const row = await this.requireAccessible(user, id);
    await this.assertCanMutate(user, row);
    const { status, progressPercent, completedAt } = this.normalizeProgress(
      dto.status ?? row.status,
      dto.progressPercent ?? row.progressPercent,
      row.completedAt,
    );
    const updated = await this.repo.update(id, {
      status: dto.status ?? status,
      progressPercent: dto.progressPercent ?? progressPercent,
      lastPositionSeconds: dto.lastPositionSeconds,
      completedAt,
    });
    return {
      message: 'Lesson progress updated successfully.',
      data: LessonProgressMapper.toResponse(updated),
    };
  }

  private normalizeProgress(
    status: string | undefined,
    progressPercent: number | undefined,
    existingCompletedAt: Date | null,
  ) {
    let nextStatus = status ?? 'NOT_STARTED';
    let nextPercent = progressPercent ?? 0;
    if (nextPercent < 0 || nextPercent > 100)
      throw new InvalidLessonProgressException('progressPercent must be between 0 and 100.');
    if (nextPercent === 100) nextStatus = 'COMPLETED';
    if (nextStatus === 'COMPLETED' && nextPercent < 100) nextPercent = 100;
    const completedAt =
      nextStatus === 'COMPLETED' || nextPercent === 100
        ? (existingCompletedAt ?? new Date())
        : null;
    return {
      status: nextStatus as LessonProgressRecord['status'],
      progressPercent: nextPercent,
      completedAt,
    };
  }

  private isStudentOnly(user: AuthenticatedUser) {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async resolveStudentIdForWrite(
    user: AuthenticatedUser,
    organizationId: string,
    studentId?: string,
  ) {
    if (this.isStudentOnly(user)) {
      return this.requireOwnStudentProfile(organizationId, user.id);
    }
    if (!studentId) throw new InvalidLessonProgressException('studentId is required.');
    const ok = await this.repo.studentProfileExistsInOrganization(organizationId, studentId);
    if (!ok) throw new StudentProfileNotFoundException();
    return studentId;
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string) {
    const id = await this.repo.findStudentProfileId(organizationId, userId);
    if (!id) throw new StudentProfileNotFoundException();
    return id;
  }

  private async assertCanMutate(user: AuthenticatedUser, row: LessonProgressRecord) {
    if (!this.isStudentOnly(user)) return;
    const own = await this.requireOwnStudentProfile(row.organizationId, user.id);
    if (own !== row.studentId) throw new LessonProgressForbiddenException();
  }

  private async requireAccessible(user: AuthenticatedUser, id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new LessonProgressNotFoundException();
    this.assertOrganizationAccess(user, row.organizationId);
    if (this.isStudentOnly(user)) {
      const own = await this.requireOwnStudentProfile(row.organizationId, user.id);
      if (own !== row.studentId) throw new LessonProgressForbiddenException();
    }
    return row;
  }

  private resolveOrganizationId(user: AuthenticatedUser, organizationId?: string) {
    if (organizationId) {
      this.assertOrganizationAccess(user, organizationId);
      return organizationId;
    }
    if (user.organizationIds.length === 1) {
      const [only] = user.organizationIds;
      if (only) return only;
    }
    throw new OrganizationAccessDeniedException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string) {
    if (!user.organizationIds.includes(organizationId))
      throw new OrganizationAccessDeniedException();
  }
}
