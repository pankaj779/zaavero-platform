import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type { CertificateVerificationResponseDto } from '../dto/certificate-verification-response.dto';

function notFoundResponse(): CertificateVerificationResponseDto {
  return {
    status: 'NOT_FOUND',
    certificateNumber: null,
    verificationCode: null,
    studentName: null,
    courseName: null,
    organizationName: null,
    organizationLogoUrl: null,
    completedAt: null,
    issuedAt: null,
    revokedAt: null,
  };
}

@Injectable()
export class CertificateVerificationService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /**
   * Public, unauthenticated verification. Only ISSUED and REVOKED
   * certificates are acknowledged; anything else reads as NOT_FOUND so the
   * endpoint cannot be used to probe drafts.
   */
  async verify(verificationCode: string): Promise<CertificateVerificationResponseDto> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationCode },
      select: {
        status: true,
        certificateNumber: true,
        verificationCode: true,
        completedAt: true,
        issuedAt: true,
        revokedAt: true,
        organization: { select: { name: true, logo: true } },
        student: {
          select: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        course: { select: { title: true } },
      },
    });
    if (!certificate || (certificate.status !== 'ISSUED' && certificate.status !== 'REVOKED')) {
      return notFoundResponse();
    }

    const student = certificate.student.user;
    return {
      status: certificate.status === 'REVOKED' ? 'REVOKED' : 'VALID',
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      studentName: `${student.firstName} ${student.lastName}`.trim() || student.email,
      courseName: certificate.course.title,
      organizationName: certificate.organization.name,
      organizationLogoUrl: certificate.organization.logo,
      completedAt: certificate.completedAt?.toISOString() ?? null,
      issuedAt: certificate.issuedAt?.toISOString() ?? null,
      revokedAt: certificate.revokedAt?.toISOString() ?? null,
    };
  }
}
