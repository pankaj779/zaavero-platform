import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { PdfService } from '../../pdf/services/pdf.service';
import { StorageService } from '../../storage/services/storage.service';
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
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepository,
    private readonly businessEmail?: BusinessEmailService,
    private readonly storageService?: StorageService,
    private readonly pdfService?: PdfService,
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
    const [pdfUrl, qrImageUrl] = await Promise.all([
      this.resolveMedia(dto.pdfUrl, dto.organizationId, 'CERTIFICATE_PDF'),
      this.resolveMedia(dto.qrImageUrl, dto.organizationId, 'CERTIFICATE_QR'),
    ]);

    const certificate = await this.issueWithUniqueCodes({
      organizationId: dto.organizationId,
      studentId: dto.studentId,
      courseId: dto.courseId,
      batchId: dto.batchId ?? null,
      templateId: dto.templateId ?? null,
      pdfUrl: pdfUrl ?? null,
      qrImageUrl: qrImageUrl ?? null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      issuedAt: new Date(),
    });

    // The PDF + QR are generated before the issue email so the email can
    // attach the real document. A generation failure never blocks issuance.
    const finalized = await this.generatePdfSafely(certificate, user.id, false);
    await this.businessEmail?.certificateIssued(certificate.id);

    return {
      message: 'Certificate issued successfully.',
      data: CertificateMapper.toResponse(finalized),
    };
  }

  async regeneratePdf(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    const certificate = await this.requireAccessibleCertificate(user, id);
    const course = await this.requireCourseInOrganization(
      certificate.organizationId,
      certificate.courseId,
    );
    await this.assertCanMutateCourseCertificates(user, course);

    if (certificate.status !== 'ISSUED') {
      throw new InvalidCertificateException('Only issued certificates can be regenerated.');
    }
    if (!this.pdfService) {
      throw new InvalidCertificateException('PDF service is unavailable.');
    }

    await this.pdfService.ensureCertificatePdf(certificate.id, {
      force: true,
      actorUserId: user.id,
    });
    const refreshed = (await this.certificateRepository.findById(certificate.id)) ?? certificate;

    return {
      message: 'Certificate PDF regenerated successfully.',
      data: CertificateMapper.toResponse(refreshed),
    };
  }

  /** Generates the PDF and returns the refreshed record; failures are logged only. */
  private async generatePdfSafely(
    certificate: CertificateRecord,
    actorUserId: string,
    force: boolean,
  ): Promise<CertificateRecord> {
    if (!this.pdfService || certificate.pdfUrl) return certificate;
    try {
      await this.pdfService.ensureCertificatePdf(certificate.id, { force, actorUserId });
      return (await this.certificateRepository.findById(certificate.id)) ?? certificate;
    } catch (error: unknown) {
      this.logger.error(
        `Certificate PDF generation failed for ${certificate.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return certificate;
    }
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
    const [pdfUrl, qrImageUrl] = await Promise.all([
      this.resolveMedia(dto.pdfUrl, certificate.organizationId, 'CERTIFICATE_PDF'),
      this.resolveMedia(dto.qrImageUrl, certificate.organizationId, 'CERTIFICATE_QR'),
    ]);

    const updated = await this.certificateRepository.update(id, {
      templateId: dto.templateId,
      pdfUrl,
      qrImageUrl,
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
    return `CERT-${String(Date.now())}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /** Cryptographically random, URL-safe, non-sequential verification code. */
  private generateVerificationCode(): string {
    return `VER-${randomBytes(18).toString('base64url')}`;
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

  private async resolveMedia(
    reference: string | null | undefined,
    organizationId: string,
    entityType: 'CERTIFICATE_PDF' | 'CERTIFICATE_QR',
  ): Promise<string | null | undefined> {
    if (reference === undefined || reference === null) return reference;
    if (!this.storageService) {
      throw new InvalidCertificateException('Storage service is unavailable.');
    }
    return this.storageService.resolveAssetUrl(reference, { organizationId, entityType });
  }
}
