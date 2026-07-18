import { Inject, Injectable } from '@nestjs/common';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { ENROLLMENT_REPOSITORY } from '../constants/injection-tokens';
import type {
  EnrollmentResponseDto,
  PaginatedEnrollmentsResponseDto,
} from '../dto/enrollment-response.dto';
import type { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import type { ListEnrollmentsQueryDto } from '../dto/list-enrollments-query.dto';
import type { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import {
  BatchNotFoundException,
  CourseNotFoundException,
  EnrollmentConflictException,
  EnrollmentForbiddenException,
  EnrollmentNotFoundException,
  InvalidEnrollmentException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherEnrollmentMutationForbiddenException,
} from '../exceptions';
import type {
  BatchContextRecord,
  EnrollmentRecord,
  EnrollmentRepository,
} from '../interfaces/enrollment-repository.interface';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class EnrollmentService {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly businessEmail?: BusinessEmailService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListEnrollmentsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedEnrollmentsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let studentId = query.studentId;
    let excludeDropped = false;
    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
      if (query.studentId && query.studentId !== ownStudentId) {
        throw new EnrollmentForbiddenException();
      }
      studentId = ownStudentId;
      excludeDropped = true;
    }

    const result = await this.enrollmentRepository.findMany({
      organizationId,
      batchId: query.batchId,
      courseId: query.courseId,
      studentId,
      status: query.status,
      excludeDropped,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

    return {
      message: 'Enrollments retrieved successfully.',
      data: {
        items: EnrollmentMapper.toResponseList(result.items),
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
  ): Promise<ControllerSuccessPayload<EnrollmentResponseDto>> {
    const enrollment = await this.requireAccessibleEnrollment(user, id);

    return {
      message: 'Enrollment retrieved successfully.',
      data: EnrollmentMapper.toResponse(enrollment),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateEnrollmentDto,
  ): Promise<ControllerSuccessPayload<EnrollmentResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const batch = await this.requireBatchInOrganization(dto.organizationId, dto.batchId);
    await this.assertCanMutateBatchEnrollments(user, batch);

    if (batch.courseId !== dto.courseId) {
      throw new InvalidEnrollmentException('Batch does not belong to the specified course.');
    }

    const courseExists = await this.enrollmentRepository.courseExistsInOrganization(
      dto.organizationId,
      dto.courseId,
    );
    if (!courseExists) {
      throw new CourseNotFoundException();
    }

    const studentExists = await this.enrollmentRepository.studentProfileExistsInOrganization(
      dto.organizationId,
      dto.studentId,
    );
    if (!studentExists) {
      throw new StudentProfileNotFoundException();
    }

    const existing = await this.enrollmentRepository.findByBatchAndStudent(
      dto.batchId,
      dto.studentId,
    );

    if (existing && existing.status !== 'DROPPED') {
      throw new EnrollmentConflictException();
    }

    try {
      if (existing?.status === 'DROPPED') {
        const reactivated = await this.enrollmentRepository.update(existing.id, {
          status: dto.status ?? 'ACTIVE',
          completedAt: null,
        });
        await this.businessEmail?.enrollmentCreated(reactivated.id);

        return {
          message: 'Enrollment created successfully.',
          data: EnrollmentMapper.toResponse(reactivated),
        };
      }

      const enrollment = await this.enrollmentRepository.create({
        organizationId: dto.organizationId,
        courseId: dto.courseId,
        batchId: dto.batchId,
        studentId: dto.studentId,
        status: dto.status,
      });
      await this.businessEmail?.enrollmentCreated(enrollment.id);

      return {
        message: 'Enrollment created successfully.',
        data: EnrollmentMapper.toResponse(enrollment),
      };
    } catch (error: unknown) {
      this.rethrowConflict(error);
      throw error;
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateEnrollmentDto,
  ): Promise<ControllerSuccessPayload<EnrollmentResponseDto>> {
    const enrollment = await this.requireAccessibleEnrollment(user, id);
    const batch = await this.requireBatchInOrganization(
      enrollment.organizationId,
      enrollment.batchId,
    );
    await this.assertCanMutateBatchEnrollments(user, batch);

    if (dto.status === 'DROPPED') {
      throw new InvalidEnrollmentException(
        'Use DELETE to soft-delete an enrollment by marking it as dropped.',
      );
    }

    const completedAt =
      dto.completedAt === undefined
        ? undefined
        : dto.completedAt === null
          ? null
          : new Date(dto.completedAt);

    const updated = await this.enrollmentRepository.update(id, {
      status: dto.status,
      completedAt,
    });

    return {
      message: 'Enrollment updated successfully.',
      data: EnrollmentMapper.toResponse(updated),
    };
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<EnrollmentResponseDto>> {
    const enrollment = await this.requireAccessibleEnrollment(user, id);
    const batch = await this.requireBatchInOrganization(
      enrollment.organizationId,
      enrollment.batchId,
    );
    await this.assertCanMutateBatchEnrollments(user, batch);

    const deleted = await this.enrollmentRepository.softDelete(id);

    return {
      message: 'Enrollment deleted successfully.',
      data: EnrollmentMapper.toResponse(deleted),
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

    throw new OrganizationAccessDeniedException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new OrganizationAccessDeniedException();
    }
  }

  private async requireAccessibleEnrollment(
    user: AuthenticatedUser,
    id: string,
  ): Promise<EnrollmentRecord> {
    const enrollment = await this.enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new EnrollmentNotFoundException();
    }

    this.assertOrganizationAccess(user, enrollment.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(enrollment.organizationId, user.id);
      if (ownStudentId !== enrollment.studentId) {
        throw new EnrollmentForbiddenException();
      }
    }

    return enrollment;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.enrollmentRepository.findStudentProfileId(
      organizationId,
      userId,
    );

    if (!studentProfileId) {
      throw new StudentProfileNotFoundException();
    }

    return studentProfileId;
  }

  private async requireBatchInOrganization(
    organizationId: string,
    batchId: string,
  ): Promise<BatchContextRecord> {
    const batch = await this.enrollmentRepository.findBatchContext(batchId);

    if (batch?.organizationId !== organizationId) {
      throw new BatchNotFoundException();
    }

    return batch;
  }

  private async assertCanMutateBatchEnrollments(
    user: AuthenticatedUser,
    batch: BatchContextRecord,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const ownProfileId = await this.enrollmentRepository.findTeacherProfileId(
      batch.organizationId,
      user.id,
    );

    if (!ownProfileId || ownProfileId !== batch.teacherId) {
      throw new TeacherEnrollmentMutationForbiddenException();
    }
  }

  private rethrowConflict(error: unknown): void {
    if (isPrismaUniqueConflict(error)) {
      throw new EnrollmentConflictException();
    }
  }
}
