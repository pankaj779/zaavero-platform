import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { StorageService } from '../../storage/services/storage.service';
import {
  SUBMISSION_STATUS_TRANSITIONS,
  type SubmissionStatusValue,
} from '../constants/submission.constants';
import { SUBMISSION_REPOSITORY } from '../constants/injection-tokens';
import type {
  PaginatedSubmissionsResponseDto,
  SubmissionResponseDto,
} from '../dto/submission-response.dto';
import type { CreateSubmissionDto } from '../dto/create-submission.dto';
import type { ListSubmissionsQueryDto } from '../dto/list-submissions-query.dto';
import type { UpdateSubmissionDto } from '../dto/update-submission.dto';
import {
  AssignmentNotFoundException,
  InvalidSubmissionException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  SubmissionConflictException,
  SubmissionForbiddenException,
  SubmissionNotFoundException,
} from '../exceptions';
import type {
  AssignmentContextRecord,
  SubmissionRecord,
  SubmissionRepository,
} from '../interfaces/submission-repository.interface';
import { SubmissionMapper } from '../mappers/submission.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class SubmissionService {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissionRepository: SubmissionRepository,
    private readonly businessEmail?: BusinessEmailService,
    private readonly storageService?: StorageService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListSubmissionsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedSubmissionsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const studentId = await this.resolveListStudentFilter(user, organizationId, query.studentId);

    const result = await this.submissionRepository.findMany({
      organizationId,
      assignmentId: query.assignmentId,
      studentId,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Submissions retrieved successfully.',
      data: {
        items: SubmissionMapper.toResponseList(result.items),
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
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    const submission = await this.requireAccessibleSubmission(user, id);

    return {
      message: 'Submission retrieved successfully.',
      data: SubmissionMapper.toResponse(submission),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const assignment = await this.requireAssignmentInOrganization(
      dto.organizationId,
      dto.assignmentId,
    );

    const studentId = await this.resolveStudentIdForCreate(user, dto);
    await this.assertStudentInOrganization(dto.organizationId, studentId);

    const existing = await this.submissionRepository.findByAssignmentAndStudent(
      dto.assignmentId,
      studentId,
    );
    if (existing) {
      throw new SubmissionConflictException();
    }

    if (this.isStudentOnly(user)) {
      const initialStatus = dto.status ?? 'PENDING';
      this.assertStudentAllowedStatus(initialStatus);
    } else if (!this.isStaff(user)) {
      throw new SubmissionForbiddenException();
    }

    const initialStatus = dto.status ?? 'PENDING';

    const submitStatus = this.resolveSubmitStatus(initialStatus, assignment);
    const submittedAt = this.isSubmitStatus(submitStatus) ? new Date() : null;
    const attachments = await this.resolveAttachments(dto.attachments, dto.organizationId, user.id);

    try {
      const submission = await this.submissionRepository.create({
        organizationId: dto.organizationId,
        assignmentId: dto.assignmentId,
        studentId,
        status: submitStatus,
        content: dto.content,
        attachments,
        submittedAt,
      });
      if (this.isSubmitStatus(submission.status)) {
        await this.businessEmail?.submissionSubmitted(submission.id);
      }

      return {
        message: 'Submission created successfully.',
        data: SubmissionMapper.toResponse(submission),
      };
    } catch (error: unknown) {
      this.rethrowConflict(error);
      throw error;
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    const submission = await this.requireAccessibleSubmission(user, id);
    const assignment = await this.requireAssignmentInOrganization(
      submission.organizationId,
      submission.assignmentId,
    );

    if (this.isStudentOnly(user)) {
      return this.updateAsStudent(user, submission, assignment, dto);
    }

    if (this.isStaff(user)) {
      return this.updateAsStaff(user, submission, assignment, dto);
    }

    throw new SubmissionForbiddenException();
  }

  private async updateAsStudent(
    user: AuthenticatedUser,
    submission: SubmissionRecord,
    assignment: AssignmentContextRecord,
    dto: UpdateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    const ownStudentId = await this.submissionRepository.findStudentProfileId(
      submission.organizationId,
      user.id,
    );

    if (!ownStudentId || ownStudentId !== submission.studentId) {
      throw new SubmissionForbiddenException();
    }

    if (dto.score !== undefined || dto.feedback !== undefined) {
      throw new SubmissionForbiddenException('Students cannot grade submissions.');
    }

    if (dto.status !== undefined) {
      this.assertStudentAllowedStatus(dto.status);
      this.assertValidStatusTransition(submission.status, dto.status);
    }

    const resolvedStatus =
      dto.status !== undefined
        ? this.resolveSubmitStatus(dto.status, assignment)
        : submission.status;

    const submittedAt =
      dto.status !== undefined && this.isSubmitStatus(resolvedStatus)
        ? new Date()
        : submission.submittedAt;
    const attachments = await this.resolveAttachments(
      dto.attachments,
      submission.organizationId,
      user.id,
    );

    const updated = await this.submissionRepository.update(submission.id, {
      content: dto.content,
      attachments,
      status: dto.status !== undefined ? resolvedStatus : undefined,
      submittedAt: dto.status !== undefined ? submittedAt : undefined,
    });
    if (!this.isSubmitStatus(submission.status) && this.isSubmitStatus(updated.status)) {
      await this.businessEmail?.submissionSubmitted(updated.id);
    }

    return {
      message: 'Submission updated successfully.',
      data: SubmissionMapper.toResponse(updated),
    };
  }

  private async updateAsStaff(
    user: AuthenticatedUser,
    submission: SubmissionRecord,
    assignment: AssignmentContextRecord,
    dto: UpdateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    await this.assertCanGradeAssignment(user, assignment);

    const isGrading =
      dto.score !== undefined ||
      dto.feedback !== undefined ||
      dto.status === 'GRADED' ||
      dto.status === 'RETURNED';

    if (isGrading) {
      return this.gradeSubmission(user, submission, assignment, dto);
    }

    if (dto.content !== undefined || dto.attachments !== undefined || dto.status !== undefined) {
      throw new SubmissionForbiddenException(
        'Teachers and admins may only grade submissions via score, feedback, and grading status.',
      );
    }

    throw new InvalidSubmissionException('No valid fields provided for update.');
  }

  private async gradeSubmission(
    user: AuthenticatedUser,
    submission: SubmissionRecord,
    assignment: AssignmentContextRecord,
    dto: UpdateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    const gradingStatus: SubmissionStatusValue =
      dto.status ??
      (dto.score !== undefined || dto.feedback !== undefined ? 'GRADED' : submission.status);

    if (gradingStatus !== 'GRADED' && gradingStatus !== 'RETURNED') {
      throw new InvalidSubmissionException(
        'Grading updates must set status to GRADED or RETURNED.',
      );
    }

    if (gradingStatus !== submission.status) {
      this.assertValidStatusTransition(submission.status, gradingStatus);
    }

    const score = dto.score !== undefined ? dto.score : submission.score;
    this.assertValidScore(score, assignment.maxScore, gradingStatus);

    const teacherProfileId = await this.submissionRepository.findTeacherProfileId(
      submission.organizationId,
      user.id,
    );

    if (!teacherProfileId) {
      throw new SubmissionForbiddenException('A teacher profile is required to grade submissions.');
    }

    const updated = await this.submissionRepository.update(submission.id, {
      ...(dto.score !== undefined ? { score: dto.score } : {}),
      ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
      status: gradingStatus,
      gradedAt: new Date(),
      gradedById: teacherProfileId,
    });
    await this.businessEmail?.submissionGraded(updated.id);

    return {
      message: 'Submission graded successfully.',
      data: SubmissionMapper.toResponse(updated),
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

  private async requireAccessibleSubmission(
    user: AuthenticatedUser,
    id: string,
  ): Promise<SubmissionRecord> {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new SubmissionNotFoundException();
    }

    this.assertOrganizationAccess(user, submission.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.submissionRepository.findStudentProfileId(
        submission.organizationId,
        user.id,
      );

      if (!ownStudentId || ownStudentId !== submission.studentId) {
        throw new SubmissionForbiddenException();
      }
    }

    return submission;
  }

  private async requireAssignmentInOrganization(
    organizationId: string,
    assignmentId: string,
  ): Promise<AssignmentContextRecord> {
    const assignment = await this.submissionRepository.findAssignmentContext(assignmentId);

    if (assignment?.organizationId !== organizationId || assignment.deletedAt !== null) {
      throw new AssignmentNotFoundException();
    }

    return assignment;
  }

  private async assertStudentInOrganization(
    organizationId: string,
    studentId: string,
  ): Promise<void> {
    const exists = await this.submissionRepository.studentProfileExistsInOrganization(
      organizationId,
      studentId,
    );

    if (!exists) {
      throw new StudentProfileNotFoundException();
    }
  }

  private async resolveStudentIdForCreate(
    user: AuthenticatedUser,
    dto: CreateSubmissionDto,
  ): Promise<string> {
    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.submissionRepository.findStudentProfileId(
        dto.organizationId,
        user.id,
      );

      if (!ownStudentId) {
        throw new StudentProfileNotFoundException();
      }

      if (dto.studentId && dto.studentId !== ownStudentId) {
        throw new SubmissionForbiddenException('Students may only create their own submissions.');
      }

      return ownStudentId;
    }

    if (!dto.studentId) {
      throw new InvalidSubmissionException('studentId is required for this submission.');
    }

    return dto.studentId;
  }

  private async resolveListStudentFilter(
    user: AuthenticatedUser,
    organizationId: string,
    studentId?: string,
  ): Promise<string | undefined> {
    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.submissionRepository.findStudentProfileId(
        organizationId,
        user.id,
      );

      if (!ownStudentId) {
        throw new StudentProfileNotFoundException();
      }

      if (studentId && studentId !== ownStudentId) {
        throw new SubmissionForbiddenException();
      }

      return ownStudentId;
    }

    return studentId;
  }

  private async assertCanGradeAssignment(
    user: AuthenticatedUser,
    assignment: AssignmentContextRecord,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const course = await this.submissionRepository.findCourseContext(assignment.courseId);
    const ownTeacherId = await this.submissionRepository.findTeacherProfileId(
      assignment.organizationId,
      user.id,
    );

    if (!course || !ownTeacherId || ownTeacherId !== course.teacherId) {
      throw new SubmissionForbiddenException(
        'You may only grade submissions for courses you teach.',
      );
    }
  }

  private assertValidStatusTransition(
    current: SubmissionStatusValue,
    next: SubmissionStatusValue,
  ): void {
    if (current === next) {
      return;
    }

    const allowed = SUBMISSION_STATUS_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new InvalidSubmissionException(`Invalid status transition from ${current} to ${next}.`);
    }
  }

  private assertStudentAllowedStatus(status: SubmissionStatusValue): void {
    if (status !== 'PENDING' && status !== 'SUBMITTED' && status !== 'LATE') {
      throw new SubmissionForbiddenException('Students may only set PENDING, SUBMITTED, or LATE.');
    }
  }

  private resolveSubmitStatus(
    requested: SubmissionStatusValue,
    assignment: AssignmentContextRecord,
  ): SubmissionStatusValue {
    if (!this.isSubmitStatus(requested)) {
      return requested;
    }

    if (assignment.dueAt && assignment.dueAt.getTime() < Date.now()) {
      return 'LATE';
    }

    return requested === 'LATE' ? 'LATE' : 'SUBMITTED';
  }

  private isSubmitStatus(status: SubmissionStatusValue): boolean {
    return status === 'SUBMITTED' || status === 'LATE';
  }

  private assertValidScore(
    score: number | null,
    maxScore: number | null,
    status: SubmissionStatusValue,
  ): void {
    if (status === 'GRADED' && score === null) {
      throw new InvalidSubmissionException('Score is required when status is GRADED.');
    }

    if (score === null) {
      return;
    }

    if (score < 0) {
      throw new InvalidSubmissionException('Score cannot be negative.');
    }

    if (maxScore !== null && score > maxScore) {
      throw new InvalidSubmissionException(
        `Score cannot exceed the assignment maxScore of ${String(maxScore)}.`,
      );
    }
  }

  private isStaff(user: AuthenticatedUser): boolean {
    return user.roles.includes(AUTH_ROLES.admin) || user.roles.includes(AUTH_ROLES.teacher);
  }

  private async resolveAttachments(
    references: string[] | undefined,
    organizationId: string,
    ownerUserId: string,
  ): Promise<string[] | undefined> {
    if (references === undefined) return undefined;
    if (!this.storageService) {
      throw new InvalidSubmissionException('Storage service is unavailable.');
    }
    return this.storageService.resolveAssetUrls(references, {
      organizationId,
      entityType: 'SUBMISSION_ATTACHMENT',
      ownerUserId,
    });
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return user.roles.includes(AUTH_ROLES.student) && !this.isStaff(user);
  }

  private rethrowConflict(error: unknown): void {
    if (isPrismaUniqueConflict(error)) {
      throw new SubmissionConflictException();
    }
  }
}
