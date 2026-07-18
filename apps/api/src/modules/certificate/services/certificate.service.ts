import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CERTIFICATE_CODE_MAX_RETRIES } from '../constants/certificate.constants';
import { CERTIFICATE_REPOSITORY } from '../constants/injection-tokens';
import type {
  CertificateResponseDto,
  PaginatedCertificatesResponseDto,
} from '../dto/certificate-response.dto';
import type { IssueCertificateDto } from '../dto/issue-certificate.dto';
import type { ListCertificatesQueryDto } from '../dto/list-certificates-query.dto';
import type { UpdateCertificateDto } from '../dto/update-certificate.dto';
import {
  BatchNotFoundException,
  CertificateConflictException,
  CertificateMutationForbiddenException,
  CertificateNotFoundException,
  CourseNotFoundException,
  InvalidCertificateException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
} from '../exceptions';
import type {
  CertificateRecord,
  CertificateRepository,
  CourseContextRecord,
} from '../interfaces/certificate-repository.interface';
import { CertificateMapper } from '../mappers/certificate.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class CertificateService {
  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepository,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListCertificatesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedCertificatesResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const studentId = await this.resolveListStudentFilter(user, organizationId, query.studentId);

    const result = await this.certificateRepository.findMany({
      organizationId,
      studentId,
      courseId: query.courseId,
      batchId: query.batchId,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Certificates retrieved successfully.',
      data: {
        items: CertificateMapper.toResponseList(result.items),
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
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    const certificate = await this.requireAccessibleCertificate(user, id);

    return {
      message: 'Certificate retrieved successfully.',
      data: CertificateMapper.toResponse(certificate),
    };
  }

  async verifyByCode(
    user: AuthenticatedUser,
    verificationCode: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    const certificate = await this.certificateRepository.findByVerificationCode(verificationCode);

    if (!certificate) {
      throw new CertificateNotFoundException('Certificate verification failed.');
    }

    this.assertOrganizationAccess(user, certificate.organizationId);

    if (this.isStudentOnly(user)) {
      await this.assertStudentOwnsCertificate(user, certificate);
    }

    return {
      message: 'Certificate verified successfully.',
      data: CertificateMapper.toResponse(certificate),
    };
  }

  async issue(
    user: AuthenticatedUser,
    dto: IssueCertificateDto,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const course = await this.requireCourseInOrganization(dto.organizationId, dto.courseId);
    await this.assertCanMutateCourseCertificates(user, course);

    if (dto.batchId) {
      await this.requireBatchForCourse(dto.organizationId, dto.courseId, dto.batchId);
    }

    await this.assertStudentInOrganization(dto.organizationId, dto.studentId);

    const certificate = await this.issueWithUniqueCodes({
      organizationId: dto.organizationId,
      studentId: dto.studentId,
      courseId: dto.courseId,
      batchId: dto.batchId ?? null,
      templateId: dto.templateId ?? null,
      pdfUrl: dto.pdfUrl ?? null,
      issuedAt: new Date(),
    });

    return {
      message: 'Certificate issued successfully.',
      data: CertificateMapper.toResponse(certificate),
    };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCertificateDto,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    const certificate = await this.requireAccessibleCertificate(user, id);
    const course = await this.requireCourseInOrganization(
      certificate.organizationId,
      certificate.courseId,
    );
    await this.assertCanMutateCourseCertificates(user, course);

    if (certificate.status === 'REVOKED') {
      throw new InvalidCertificateException('Revoked certificates cannot be updated.');
    }

    if (certificate.status === 'ISSUED' && dto.status !== undefined) {
      throw new InvalidCertificateException('Issued certificates cannot change status via update.');
    }

    const updated = await this.certificateRepository.update(id, {
      templateId: dto.templateId,
      pdfUrl: dto.pdfUrl,
      status: dto.status,
    });

    return {
      message: 'Certificate updated successfully.',
      data: CertificateMapper.toResponse(updated),
    };
  }

  async revoke(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    const certificate = await this.requireAccessibleCertificate(user, id);
    const course = await this.requireCourseInOrganization(
      certificate.organizationId,
      certificate.courseId,
    );
    await this.assertCanMutateCourseCertificates(user, course);

    if (certificate.status === 'REVOKED') {
      throw new InvalidCertificateException('Certificate is already revoked.');
    }

    const revoked = await this.certificateRepository.revoke(id, new Date());

    return {
      message: 'Certificate revoked successfully.',
      data: CertificateMapper.toResponse(revoked),
    };
  }

  private async issueWithUniqueCodes(
    data: Omit<
      Parameters<CertificateRepository['issue']>[0],
      'certificateNumber' | 'verificationCode'
    >,
  ): Promise<CertificateRecord> {
    for (let attempt = 0; attempt < CERTIFICATE_CODE_MAX_RETRIES; attempt += 1) {
      try {
        return await this.certificateRepository.issue({
          ...data,
          certificateNumber: this.generateCertificateNumber(),
          verificationCode: this.generateVerificationCode(),
        });
      } catch (error: unknown) {
        if (!isPrismaUniqueConflict(error) || attempt === CERTIFICATE_CODE_MAX_RETRIES - 1) {
          if (isPrismaUniqueConflict(error)) {
            throw new CertificateConflictException();
          }
          throw error;
        }
      }
    }

    throw new CertificateConflictException();
  }

  private generateCertificateNumber(): string {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `CERT-${String(Date.now())}-${random}`;
  }

  private generateVerificationCode(): string {
    return `VER-${randomUUID()}`;
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

  private async requireAccessibleCertificate(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CertificateRecord> {
    const certificate = await this.certificateRepository.findById(id);

    if (!certificate) {
      throw new CertificateNotFoundException();
    }

    this.assertOrganizationAccess(user, certificate.organizationId);

    if (this.isStudentOnly(user)) {
      await this.assertStudentOwnsCertificate(user, certificate);
    }

    return certificate;
  }

  private async assertStudentOwnsCertificate(
    user: AuthenticatedUser,
    certificate: CertificateRecord,
  ): Promise<void> {
    const ownStudentId = await this.certificateRepository.findStudentProfileId(
      certificate.organizationId,
      user.id,
    );

    if (!ownStudentId || ownStudentId !== certificate.studentId) {
      throw new OrganizationAccessDeniedException();
    }
  }

  private async requireCourseInOrganization(
    organizationId: string,
    courseId: string,
  ): Promise<CourseContextRecord> {
    const course = await this.certificateRepository.findCourseContext(courseId);

    if (course?.organizationId !== organizationId) {
      throw new CourseNotFoundException();
    }

    return course;
  }

  private async requireBatchForCourse(
    organizationId: string,
    courseId: string,
    batchId: string,
  ): Promise<void> {
    const batch = await this.certificateRepository.findBatchContext(batchId);

    if (batch?.organizationId !== organizationId) {
      throw new BatchNotFoundException();
    }

    if (batch.courseId !== courseId) {
      throw new InvalidCertificateException('Batch does not belong to the specified course.');
    }
  }

  private async assertStudentInOrganization(
    organizationId: string,
    studentId: string,
  ): Promise<void> {
    const exists = await this.certificateRepository.studentProfileExistsInOrganization(
      organizationId,
      studentId,
    );

    if (!exists) {
      throw new StudentProfileNotFoundException();
    }
  }

  private async resolveListStudentFilter(
    user: AuthenticatedUser,
    organizationId: string,
    studentId?: string,
  ): Promise<string | undefined> {
    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.certificateRepository.findStudentProfileId(
        organizationId,
        user.id,
      );

      if (!ownStudentId) {
        throw new StudentProfileNotFoundException();
      }

      if (studentId && studentId !== ownStudentId) {
        throw new OrganizationAccessDeniedException();
      }

      return ownStudentId;
    }

    return studentId;
  }

  private async assertCanMutateCourseCertificates(
    user: AuthenticatedUser,
    course: CourseContextRecord,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const ownProfileId = await this.certificateRepository.findTeacherProfileId(
      course.organizationId,
      user.id,
    );

    if (!ownProfileId || ownProfileId !== course.teacherId) {
      throw new CertificateMutationForbiddenException();
    }
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }
}
