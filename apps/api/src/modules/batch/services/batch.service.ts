import { Inject, Injectable } from '@nestjs/common';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BATCH_REPOSITORY } from '../constants/injection-tokens';
import type { BatchResponseDto, PaginatedBatchesResponseDto } from '../dto/batch-response.dto';
import type { CreateBatchDto } from '../dto/create-batch.dto';
import type { ListBatchesQueryDto } from '../dto/list-batches-query.dto';
import type { UpdateBatchDto } from '../dto/update-batch.dto';
import {
  BatchCourseNotFoundException,
  BatchForbiddenException,
  BatchInvalidCapacityException,
  BatchInvalidScheduleException,
  BatchMutationForbiddenException,
  BatchNameConflictException,
  BatchNotFoundException,
  BatchOrganizationAccessException,
  BatchTeacherProfileRequiredException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type { BatchRecord, BatchRepository } from '../interfaces/batch-repository.interface';
import { BatchMapper } from '../mappers/batch.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class BatchService {
  constructor(
    @Inject(BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListBatchesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedBatchesResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let enrolledStudentId: string | undefined;
    if (this.isStudentOnly(user)) {
      enrolledStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
    }

    const result = await this.batchRepository.findMany({
      organizationId,
      search: query.search,
      status: query.status,
      courseId: query.courseId,
      teacherId: query.teacherId,
      enrolledStudentId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

    return {
      message: 'Batches retrieved successfully.',
      data: {
        items: BatchMapper.toResponseList(result.items),
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
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    const batch = await this.requireAccessibleBatch(user, id);

    return {
      message: 'Batch retrieved successfully.',
      data: BatchMapper.toResponse(batch),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateBatchDto,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);
    this.assertValidCapacity(dto.maxStudents);
    this.assertValidSchedule(dto.startDate, dto.endDate);

    const courseExists = await this.batchRepository.courseExistsInOrganization(
      dto.organizationId,
      dto.courseId,
    );
    if (!courseExists) {
      throw new BatchCourseNotFoundException();
    }

    const teacherId = await this.resolveTeacherIdForCreate(user, dto);
    await this.assertNameAvailable(dto.courseId, dto.name);

    try {
      const batch = await this.batchRepository.create({
        organizationId: dto.organizationId,
        courseId: dto.courseId,
        teacherId,
        name: dto.name,
        status: dto.status,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        maxStudents: dto.maxStudents,
      });

      return {
        message: 'Batch created successfully.',
        data: BatchMapper.toResponse(batch),
      };
    } catch (error: unknown) {
      this.rethrowNameConflict(error);
      throw error;
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateBatchDto,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    const batch = await this.requireAccessibleBatch(user, id);
    await this.assertCanMutateBatch(user, batch);

    if (dto.maxStudents !== undefined) {
      this.assertValidCapacity(dto.maxStudents);
    }

    const nextStartDate = dto.startDate ?? batch.startDate.toISOString();
    const nextEndDate =
      dto.endDate === undefined ? batch.endDate?.toISOString() : (dto.endDate ?? undefined);
    this.assertValidSchedule(nextStartDate, nextEndDate);

    if (dto.teacherId !== undefined) {
      const exists = await this.batchRepository.teacherProfileExistsInOrganization(
        batch.organizationId,
        dto.teacherId,
      );
      if (!exists) {
        throw new BatchTeacherProfileRequiredException(
          'The specified teacher profile was not found in this organization.',
        );
      }
    }

    if (dto.name !== undefined && dto.name !== batch.name) {
      await this.assertNameAvailable(batch.courseId, dto.name);
    }

    try {
      const updated = await this.batchRepository.update(id, {
        name: dto.name,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate:
          dto.endDate === undefined
            ? undefined
            : dto.endDate === null
              ? null
              : new Date(dto.endDate),
        maxStudents: dto.maxStudents,
        teacherId: dto.teacherId,
      });

      return {
        message: 'Batch updated successfully.',
        data: BatchMapper.toResponse(updated),
      };
    } catch (error: unknown) {
      this.rethrowNameConflict(error);
      throw error;
    }
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    const batch = await this.requireAccessibleBatch(user, id);
    await this.assertCanMutateBatch(user, batch);

    const deleted = await this.batchRepository.softDelete(id);

    return {
      message: 'Batch deleted successfully.',
      data: BatchMapper.toResponse(deleted),
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

    throw new BatchOrganizationAccessException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new BatchOrganizationAccessException();
    }
  }

  private async requireAccessibleBatch(user: AuthenticatedUser, id: string): Promise<BatchRecord> {
    const batch = await this.batchRepository.findById(id);

    if (batch?.deletedAt !== null) {
      throw new BatchNotFoundException();
    }

    this.assertOrganizationAccess(user, batch.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(batch.organizationId, user.id);
      const enrolled = await this.batchRepository.isStudentEnrolledInBatch(batch.id, ownStudentId);
      if (!enrolled) {
        throw new BatchForbiddenException();
      }
    }

    return batch;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.batchRepository.findStudentProfileId(
      organizationId,
      userId,
    );

    if (!studentProfileId) {
      throw new StudentProfileNotFoundException();
    }

    return studentProfileId;
  }

  private async assertCanMutateBatch(user: AuthenticatedUser, batch: BatchRecord): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const ownProfileId = await this.batchRepository.findTeacherProfileId(
      batch.organizationId,
      user.id,
    );

    if (!ownProfileId || ownProfileId !== batch.teacherId) {
      throw new BatchMutationForbiddenException();
    }
  }

  private async resolveTeacherIdForCreate(
    user: AuthenticatedUser,
    dto: CreateBatchDto,
  ): Promise<string> {
    if (dto.teacherId) {
      const exists = await this.batchRepository.teacherProfileExistsInOrganization(
        dto.organizationId,
        dto.teacherId,
      );
      if (!exists) {
        throw new BatchTeacherProfileRequiredException(
          'The specified teacher profile was not found in this organization.',
        );
      }

      if (
        !user.roles.includes(AUTH_ROLES.admin) &&
        !(await this.isOwnTeacherProfile(user, dto.organizationId, dto.teacherId))
      ) {
        throw new BatchMutationForbiddenException(
          'You may only create batches under your own teacher profile.',
        );
      }

      return dto.teacherId;
    }

    const ownProfileId = await this.batchRepository.findTeacherProfileId(
      dto.organizationId,
      user.id,
    );

    if (!ownProfileId) {
      throw new BatchTeacherProfileRequiredException();
    }

    return ownProfileId;
  }

  private async isOwnTeacherProfile(
    user: AuthenticatedUser,
    organizationId: string,
    teacherProfileId: string,
  ): Promise<boolean> {
    const ownProfileId = await this.batchRepository.findTeacherProfileId(organizationId, user.id);
    return ownProfileId === teacherProfileId;
  }

  private async assertNameAvailable(courseId: string, name: string): Promise<void> {
    const existing = await this.batchRepository.findByCourseName(courseId, name);
    if (existing) {
      throw new BatchNameConflictException();
    }
  }

  private assertValidCapacity(maxStudents: number | null | undefined): void {
    if (maxStudents === undefined || maxStudents === null) {
      return;
    }

    if (maxStudents <= 0) {
      throw new BatchInvalidCapacityException();
    }
  }

  private assertValidSchedule(startDate: string, endDate?: string): void {
    if (!endDate) {
      return;
    }

    if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      throw new BatchInvalidScheduleException();
    }
  }

  private rethrowNameConflict(error: unknown): void {
    if (isPrismaUniqueConflict(error)) {
      throw new BatchNameConflictException();
    }
  }
}
