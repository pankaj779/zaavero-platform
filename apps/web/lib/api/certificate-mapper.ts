import {
  teacherCertificateComingSoonFeatures,
  type StudentCertificateDto,
  type StudentCertificateStatus,
} from '../teacher/certificate-types';
import { getCertificateVerificationUrl } from '../constants/routes';

export type PublicCertificateVerificationStatus = 'VALID' | 'REVOKED' | 'NOT_FOUND';

/** Scrubbed payload returned by the unauthenticated verification endpoint. */
export interface PublicCertificateVerificationApiRecord {
  status: PublicCertificateVerificationStatus;
  certificateNumber: string | null;
  verificationCode: string | null;
  studentName: string | null;
  courseName: string | null;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  completedAt: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
}

export interface PublicCertificateVerificationDto extends PublicCertificateVerificationApiRecord {
  verificationUrl: string | null;
}

/** Raw certificate payload from NestJS Certificate API (frontend-owned mirror). */
export interface CertificateApiRecord {
  id: string;
  organizationId: string;
  studentId: string;
  courseId: string;
  batchId: string | null;
  templateId: string | null;
  status: string;
  certificateNumber: string;
  verificationCode: string;
  pdfUrl: string | null;
  qrImageUrl?: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertificateListResult {
  items: StudentCertificateDto[];
  meta: CertificateListMeta;
  /** Raw templateId per certificate id — used to derive placeholder template cards. */
  templateIds: ReadonlyMap<string, string | null>;
}

export interface CertificateCourseLookup {
  id: string;
  slug: string;
  title: string;
}

export interface CertificateBatchLookup {
  id: string;
  name: string;
}

function mapStatus(status: string): StudentCertificateStatus {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'pending';
    case 'ISSUED':
      return 'issued';
    case 'REVOKED':
      return 'revoked';
    case 'ELIGIBLE':
    default:
      return 'eligible';
  }
}

/**
 * Maps NestJS certificate records to teacher workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - student name / email / avatar (API returns studentId only)
 * - course title/slug (enriched via lookups when available)
 * - batch name (enriched via lookups when available)
 * - mentor name
 * - template preview metadata
 * - verificationUrl remains null until a verification route is exposed
 */
export function mapCertificateApiToTeacherSummary(
  record: CertificateApiRecord,
  lookups?: {
    courses?: ReadonlyMap<string, CertificateCourseLookup>;
    batches?: ReadonlyMap<string, CertificateBatchLookup>;
  },
): StudentCertificateDto {
  const status = mapStatus(record.status);
  const course = lookups?.courses?.get(record.courseId);
  const batch = record.batchId ? lookups?.batches?.get(record.batchId) : undefined;

  return {
    id: record.id,
    student: {
      id: record.studentId,
      // TEMPORARY: student identity is not on CertificateResponseDto.
      name: 'Student',
      email: '',
    },
    course: {
      id: record.courseId,
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    batch: {
      id: record.batchId ?? '',
      name: batch?.name ?? (record.batchId ? 'Batch' : 'No batch'),
    },
    status,
    issuedAt: record.issuedAt,
    certificateNumber: record.certificateNumber.trim().length > 0 ? record.certificateNumber : null,
    verificationCode: record.verificationCode,
    downloadUrl: record.pdfUrl,
    qrImageUrl: record.qrImageUrl ?? null,
    verificationUrl: getCertificateVerificationUrl(record.verificationCode),
    mentor: {
      id: '',
      // TEMPORARY: mentor identity is not on CertificateResponseDto.
      name: 'Teacher',
    },
    futureFeatures: teacherCertificateComingSoonFeatures,
    updatedAt: record.updatedAt,
  };
}

export function mapPublicCertificateVerification(
  record: PublicCertificateVerificationApiRecord,
): PublicCertificateVerificationDto {
  return {
    status: record.status,
    certificateNumber: record.certificateNumber,
    verificationCode: record.verificationCode,
    studentName: record.studentName,
    courseName: record.courseName,
    organizationName: record.organizationName,
    organizationLogoUrl: record.organizationLogoUrl,
    completedAt: record.completedAt,
    issuedAt: record.issuedAt,
    revokedAt: record.revokedAt,
    verificationUrl: record.verificationCode
      ? getCertificateVerificationUrl(record.verificationCode)
      : null,
  };
}

export function mapCertificateApiList(
  records: CertificateApiRecord[],
  lookups?: {
    courses?: ReadonlyMap<string, CertificateCourseLookup>;
    batches?: ReadonlyMap<string, CertificateBatchLookup>;
  },
): StudentCertificateDto[] {
  return records.map((record) => mapCertificateApiToTeacherSummary(record, lookups));
}

export function collectCertificateTemplateIds(
  records: CertificateApiRecord[],
): ReadonlyMap<string, string | null> {
  return new Map(records.map((record) => [record.id, record.templateId]));
}
