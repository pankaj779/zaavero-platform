import type { CertificateResponseDto } from '../dto/certificate-response.dto';
import type { CertificateRecord } from '../interfaces/certificate-repository.interface';

/**
 * Maps persistence certificate records to API response DTOs.
 */
export class CertificateMapper {
  static toResponse(record: CertificateRecord): CertificateResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      studentId: record.studentId,
      courseId: record.courseId,
      batchId: record.batchId,
      templateId: record.templateId,
      status: record.status,
      certificateNumber: record.certificateNumber,
      verificationCode: record.verificationCode,
      pdfUrl: record.pdfUrl,
      issuedAt: record.issuedAt ? record.issuedAt.toISOString() : null,
      revokedAt: record.revokedAt ? record.revokedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: CertificateRecord[]): CertificateResponseDto[] {
    return records.map((record) => CertificateMapper.toResponse(record));
  }
}
