import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { ASSIGNMENT_REPOSITORY } from '../constants/injection-tokens';
import type {
  AssignmentResponseDto,
  PaginatedAssignmentsResponseDto,
} from '../dto/assignment-response.dto';
import type { CreateAssignmentDto } from '../dto/create-assignment.dto';
import type { ListAssignmentsQueryDto } from '../dto/list-assignments-query.dto';
import type { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import {
  AssignmentForbiddenException,
  AssignmentNotFoundException,
  BatchNotFoundException,
  CourseNotFoundException,
  InvalidAssignmentException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherAssignmentMutationForbiddenException,
} from '../exceptions';
import type {
  AssignmentRecord,
  AssignmentRepository,
  BatchContextRecord,
  CourseContextRecord,
} from '../interfaces/assignment-repository.interface';
import { AssignmentMapper } from '../mappers/assignment.mapper';

@Injectable()
export class AssignmentService {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: AssignmentRepository,
    private readonly businessEmail?: BusinessEmailService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListAssignmentsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedAssignmentsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let enrolledStudentId: string | undefined;
    if (this.isStudentOnly(user)) {
      enrolledStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
    }

    const result = await this.assignmentRepository.findMany({
      organizationId,
      courseId: query.courseId,
      batchId: query.batchId,
      status: query.status,
      search: query.search,
      enrolledStudentId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Assignments retrieved successfully.',
      data: {
        items: AssignmentMapper.toResponseList(result.items),
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
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    const assignment = await this.requireAccessibleAssignment(user, id);

    return {
      message: 'Assignment retrieved successfully.',
      data: AssignmentMapper.toResponse(assignment),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateAssignmentDto,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);
    this.assertValidMaxScore(dto.maxScore);

    const course = await this.requireCourseInOrganization(dto.organizationId, dto.courseId);
    await this.assertCanMutateCourseOrBatch(user, course, dto.batchId ?? null);

    if (dto.batchId) {
      await this.requireBatchForCourse(dto.organizationId, dto.courseId, dto.batchId);
    }

    const dueAt =
      dto.dueAt === undefined ? undefined : dto.dueAt === null ? null : new Date(dto.dueAt);

    const assignment = await this.assignmentRepository.create({
      organizationId: dto.organizationId,
      courseId: dto.courseId,
      batchId: dto.batchId ?? null,
      title: dto.title,
      instructions: dto.instructions,
      status: dto.status,
      maxScore: dto.maxScore,
      dueAt,
    });
    if (assignment.status === 'PUBLISHED') {
      await this.businessEmail?.assignmentPublished(assignment.id);
    }

    return {
      message: 'Assignment created successfully.',
      data: AssignmentMapper.toResponse(assignment),
    };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateAssignmentDto,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    const assignment = await this.requireAccessibleAssignment(user, id);

    if (dto.maxScore !== undefined) {
      this.assertValidMaxScore(dto.maxScore);
    }

    const nextBatchId = dto.batchId === undefined ? assignment.batchId : dto.batchId;

    if (nextBatchId) {
      await this.requireBatchForCourse(assignment.organizationId, assignment.courseId, nextBatchId);
    }

    const course = await this.requireCourseInOrganization(
      assignment.organizationId,
      assignment.courseId,
    );
    await this.assertCanMutateCourseOrBatch(user, course, nextBatchId);

    const dueAt =
      dto.dueAt === undefined ? undefined : dto.dueAt === null ? null : new Date(dto.dueAt);

    const updated = await this.assignmentRepository.update(id, {
      title: dto.title,
      instructions: dto.instructions,
      status: dto.status,
      maxScore: dto.maxScore,
      dueAt,
      batchId: dto.batchId,
    });
    if (assignment.status !== 'PUBLISHED' && updated.status === 'PUBLISHED') {
      await this.businessEmail?.assignmentPublished(updated.id);
    }

    return {
      message: 'Assignment updated successfully.',
      data: AssignmentMapper.toResponse(updated),
    };
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    const assignment = await this.requireAccessibleAssignment(user, id);
    const course = await this.requireCourseInOrganization(
      assignment.organizationId,
      assignment.courseId,
    );
    await this.assertCanMutateCourseOrBatch(user, course, assignment.batchId);

    const deleted = await this.assignmentRepository.softDelete(id);

    return {
      message: 'Assignment deleted successfully.',
      data: AssignmentMapper.toResponse(deleted),
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

  private async requireAccessibleAssignment(
    user: AuthenticatedUser,
    id: string,
  ): Promise<AssignmentRecord> {
    const assignment = await this.assignmentRepository.findById(id);

    if (!assignment) {
      throw new AssignmentNotFoundException();
    }

    this.assertOrganizationAccess(user, assignment.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(assignment.organizationId, user.id);
      const hasAccess = await this.assignmentRepository.studentHasAccessToAssignment(
        assignment.id,
        ownStudentId,
      );
      if (!hasAccess) {
        throw new AssignmentForbiddenException();
      }
    }

    return assignment;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.assignmentRepository.findStudentProfileId(
      organizationId,
      userId,
    );

    if (!studentProfileId) {
      throw new StudentProfileNotFoundException();
    }

    return studentProfileId;
  }

  private async requireCourseInOrganization(
    organizationId: string,
    courseId: string,
  ): Promise<CourseContextRecord> {
    const course = await this.assignmentRepository.findCourseContext(courseId);

    if (course?.organizationId !== organizationId) {
      throw new CourseNotFoundException();
    }

    return course;
  }

  private async requireBatchForCourse(
    organizationId: string,
    courseId: string,
    batchId: string,
  ): Promise<BatchContextRecord> {
    const batch = await this.assignmentRepository.findBatchContext(batchId);

    if (batch?.organizationId !== organizationId) {
      throw new BatchNotFoundException();
    }

    if (batch.courseId !== courseId) {
      throw new InvalidAssignmentException('Batch does not belong to the specified course.');
    }

    return batch;
  }

  private assertValidMaxScore(maxScore?: number | null): void {
    if (maxScore !== undefined && maxScore !== null && maxScore <= 0) {
      throw new InvalidAssignmentException('maxScore must be greater than zero when set.');
    }
  }

  private async assertCanMutateCourseOrBatch(
    user: AuthenticatedUser,
    course: CourseContextRecord,
    batchId: string | null,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const ownProfileId = await this.assignmentRepository.findTeacherProfileId(
      course.organizationId,
      user.id,
    );

    if (!ownProfileId) {
      throw new TeacherAssignmentMutationForbiddenException();
    }

    if (ownProfileId === course.teacherId) {
      return;
    }

    if (batchId) {
      const batch = await this.assignmentRepository.findBatchContext(batchId);
      if (batch?.teacherId === ownProfileId) {
        return;
      }
    }

    throw new TeacherAssignmentMutationForbiddenException();
  }
}
