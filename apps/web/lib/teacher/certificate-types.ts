import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Certificate view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type StudentCertificateStatus = 'eligible' | 'pending' | 'issued' | 'revoked';
export type TeacherCertificatesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherCertificateStatusFilter = 'all' | StudentCertificateStatus;
export type TeacherCertificateSortOption = 'newest' | 'student_name' | 'course' | 'batch';
export type TeacherIntegrationAvailability = 'available' | 'coming_soon';

export interface TeacherCertificateStudentRefDto {
  id: string;
  name: string;
  email: string;
}

export interface TeacherCertificateCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherCertificateBatchRefDto {
  id: string;
  name: string;
}

export interface TeacherCertificateMentorDto {
  id: string;
  name: string;
}

export interface TeacherCertificateFutureFeaturesDto {
  pdfGeneration: TeacherIntegrationAvailability;
  qrGeneration: TeacherIntegrationAvailability;
  blockchainVerification: TeacherIntegrationAvailability;
  emailDelivery: TeacherIntegrationAvailability;
  downloads: TeacherIntegrationAvailability;
}

/** Per-student certificate recommendation / issuance record. */
export interface StudentCertificateDto {
  id: string;
  student: TeacherCertificateStudentRefDto;
  course: TeacherCertificateCourseRefDto;
  batch: TeacherCertificateBatchRefDto;
  status: StudentCertificateStatus;
  issuedAt: string | null;
  certificateNumber: string | null;
  /** Storage-backed certificate PDF URL when generated. */
  downloadUrl: string | null;
  /** Storage-backed QR image URL when generated. */
  qrImageUrl: string | null;
  /** Always null until a public verification route is exposed. */
  verificationUrl: string | null;
  mentor: TeacherCertificateMentorDto;
  futureFeatures: TeacherCertificateFutureFeaturesDto;
  updatedAt: string;
}

/** Alias matching the sprint naming — same shape as StudentCertificateDto. */
export type TeacherCertificateSummaryDto = StudentCertificateDto;

/** Template catalog entry — placeholder until a template catalog API exists. */
export interface CertificateTemplateDto {
  id: string;
  name: string;
  courseTitle: string | null;
  description: string;
  status: 'draft' | 'active' | 'archived';
  futureFeatures: TeacherCertificateFutureFeaturesDto;
}

/** Batch-level certificate rollup for the right-rail overview. */
export interface CertificateBatchDto {
  id: string;
  name: string;
  courseTitle: string;
  eligibleCount: number;
  pendingCount: number;
  issuedCount: number;
  revokedCount: number;
}

export interface TeacherCertificateStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherCertificatesPageCopy = {
  title: 'Certificates',
  description: 'Recommend and track certificates for your students across courses and batches.',
  searchPlaceholder: 'Search students, courses, or batches',
  searchLabel: 'Search certificates',
  statusFilterLabel: 'Filter by certificate status',
  sortLabel: 'Sort certificates',
  collectionLabel: 'Student certificates',
  detailsLabel: 'Certificate details',
  detailsCloseLabel: 'Close certificate details',
  templatesLabel: 'Certificate templates',
  batchesLabel: 'Batch overview',
  issueButton: 'Issue Certificate',
  downloadButton: 'Download PDF',
  verifyButton: 'Verify',
  comingSoonNote: 'Certificate engine coming soon',
  emptyTitle: 'No certificates yet',
  emptyDescription:
    'Eligible and issued certificates will appear here. Issuance tools arrive in a later sprint.',
  noMatchesTitle: 'No matching certificates',
  noMatchesDescription: 'Try a different student, course, batch, or status filter.',
  noSelectionTitle: 'Select a certificate',
  noSelectionDescription: 'Choose a student certificate to preview placeholder details.',
  errorTitle: 'Unable to load certificates',
  errorDescription: 'Something went wrong while loading Certificates. Please try again.',
  studentLabel: 'Student',
  emailLabel: 'Email',
  courseLabel: 'Course',
  batchLabel: 'Batch',
  statusLabel: 'Status',
  issuedAtLabel: 'Issued',
  notIssuedLabel: 'Not issued yet',
  certificateNumberLabel: 'Certificate number',
  noNumberLabel: 'Not assigned yet',
  mentorLabel: 'Mentor',
  downloadUrlLabel: 'Download URL',
  verificationUrlLabel: 'Verification URL',
  urlPending: 'Not available yet',
  futureFeaturesLabel: 'Future integrations',
  eligibleLabel: 'Eligible',
  pendingLabel: 'Pending',
  issuedLabel: 'Issued',
  revokedLabel: 'Revoked',
} as const;

export const teacherCertificateStatusLabel: Record<StudentCertificateStatus, string> = {
  eligible: 'Eligible',
  pending: 'Pending',
  issued: 'Issued',
  revoked: 'Revoked',
};

export const teacherCertificateStatusFilterOptions: {
  value: TeacherCertificateStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'pending', label: 'Pending' },
  { value: 'issued', label: 'Issued' },
  { value: 'revoked', label: 'Revoked' },
];

export const teacherCertificateSortOptions: {
  value: TeacherCertificateSortOption;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'student_name', label: 'Student Name' },
  { value: 'course', label: 'Course' },
  { value: 'batch', label: 'Batch' },
];

export const teacherCertificateComingSoonFeatures: TeacherCertificateFutureFeaturesDto = {
  pdfGeneration: 'available',
  qrGeneration: 'available',
  blockchainVerification: 'coming_soon',
  emailDelivery: 'coming_soon',
  downloads: 'available',
};

export function getTeacherCertificateStats(
  certificates: StudentCertificateDto[],
): TeacherCertificateStatDto[] {
  const eligible = certificates.filter((item) => item.status === 'eligible').length;
  const pending = certificates.filter((item) => item.status === 'pending').length;
  const issued = certificates.filter((item) => item.status === 'issued').length;
  const revoked = certificates.filter((item) => item.status === 'revoked').length;

  return [
    {
      id: 'eligible',
      label: 'Eligible',
      value: String(eligible),
      helper: 'Students ready for issuance review.',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: String(pending),
      helper: 'Issuance requests awaiting approval.',
    },
    {
      id: 'issued',
      label: 'Issued',
      value: String(issued),
      helper: 'Certificates marked issued.',
    },
    {
      id: 'revoked',
      label: 'Revoked',
      value: String(revoked),
      helper: 'Certificates marked revoked.',
    },
  ];
}

export function filterTeacherCertificates(
  certificates: StudentCertificateDto[],
  query: string,
  status: TeacherCertificateStatusFilter,
  options?: {
    courseId?: string;
  },
): StudentCertificateDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId ?? 'all';

  return certificates.filter((certificate) => {
    if (status !== 'all' && certificate.status !== status) {
      return false;
    }
    if (courseId !== 'all' && certificate.course.id !== courseId) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      certificate.student.name.toLowerCase().includes(normalized) ||
      certificate.student.email.toLowerCase().includes(normalized) ||
      certificate.course.title.toLowerCase().includes(normalized) ||
      certificate.course.slug.toLowerCase().includes(normalized) ||
      certificate.batch.name.toLowerCase().includes(normalized) ||
      (certificate.certificateNumber?.toLowerCase().includes(normalized) ?? false)
    );
  });
}

export function sortTeacherCertificates(
  certificates: StudentCertificateDto[],
  sort: TeacherCertificateSortOption,
): StudentCertificateDto[] {
  const next = [...certificates];

  switch (sort) {
    case 'student_name':
      return next.sort((a, b) => a.student.name.localeCompare(b.student.name));
    case 'course':
      return next.sort((a, b) => a.course.title.localeCompare(b.course.title));
    case 'batch':
      return next.sort((a, b) => a.batch.name.localeCompare(b.batch.name));
    case 'newest':
    default:
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export function getTeacherCertificateById(
  certificates: StudentCertificateDto[],
  id: string,
): StudentCertificateDto | null {
  return certificates.find((certificate) => certificate.id === id) ?? null;
}

/** Derive right-rail batch rollups from the fetched certificate list. */
export function deriveTeacherCertificateBatches(
  certificates: StudentCertificateDto[],
): CertificateBatchDto[] {
  const byBatch = new Map<string, CertificateBatchDto>();

  for (const certificate of certificates) {
    const existing = byBatch.get(certificate.batch.id);
    if (!existing) {
      byBatch.set(certificate.batch.id, {
        id: certificate.batch.id,
        name: certificate.batch.name,
        courseTitle: certificate.course.title,
        eligibleCount: certificate.status === 'eligible' ? 1 : 0,
        pendingCount: certificate.status === 'pending' ? 1 : 0,
        issuedCount: certificate.status === 'issued' ? 1 : 0,
        revokedCount: certificate.status === 'revoked' ? 1 : 0,
      });
      continue;
    }

    if (certificate.status === 'eligible') {
      existing.eligibleCount += 1;
    } else if (certificate.status === 'pending') {
      existing.pendingCount += 1;
    } else if (certificate.status === 'issued') {
      existing.issuedCount += 1;
    } else {
      existing.revokedCount += 1;
    }
  }

  return [...byBatch.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Derive placeholder template cards from certificate template IDs.
 * TEMPORARY until a Certificate Template catalog API exists.
 */
export function deriveTeacherCertificateTemplates(
  certificates: StudentCertificateDto[],
  templateIds: ReadonlyMap<string, string | null>,
): CertificateTemplateDto[] {
  const seen = new Set<string>();
  const templates: CertificateTemplateDto[] = [];

  for (const certificate of certificates) {
    const templateId = templateIds.get(certificate.id);
    if (!templateId || seen.has(templateId)) {
      continue;
    }
    seen.add(templateId);
    templates.push({
      id: templateId,
      name: 'Certificate Template',
      courseTitle: certificate.course.title,
      description: 'Template preview is not available until the certificate engine lands.',
      status: 'active',
      futureFeatures: teacherCertificateComingSoonFeatures,
    });
  }

  if (templates.length === 0) {
    return [
      {
        id: 'template_placeholder',
        name: 'Standard Completion',
        courseTitle: null,
        description: 'Default completion template. PDF rendering is not connected.',
        status: 'active',
        futureFeatures: teacherCertificateComingSoonFeatures,
      },
    ];
  }

  return templates;
}

export function formatTeacherCertificateDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherCertificateDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}

/** Maps UI sort to NestJS Certificate list sort (name/course/batch stay client-side). */
export function toCertificateListSort(sort: TeacherCertificateSortOption): {
  sortBy: 'createdAt' | 'updatedAt' | 'issuedAt' | 'certificateNumber' | 'status';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'student_name':
    case 'course':
    case 'batch':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'newest':
    default:
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
  }
}

/** Maps UI status filter to NestJS CertificateStatus. */
export function toCertificateApiStatus(
  status: TeacherCertificateStatusFilter,
): 'ELIGIBLE' | 'PENDING' | 'ISSUED' | 'REVOKED' | undefined {
  switch (status) {
    case 'eligible':
      return 'ELIGIBLE';
    case 'pending':
      return 'PENDING';
    case 'issued':
      return 'ISSUED';
    case 'revoked':
      return 'REVOKED';
    case 'all':
    default:
      return undefined;
  }
}
