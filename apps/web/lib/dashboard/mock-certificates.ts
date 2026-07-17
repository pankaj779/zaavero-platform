/**
 * Certificates DTOs — shaped like future GET /student/certificates responses.
 * Honest placeholders: no fake PDFs, QR codes, or download/verification URLs.
 */

import { formatDashboardDate } from './format-date';

export type CertificatesViewState = 'loading' | 'empty' | 'error' | 'populated';

export type CertificateStatus = 'issued' | 'processing' | 'locked';

export type CertificateStatusFilter = 'all' | CertificateStatus;

export type CertificateSortOption = 'newest' | 'oldest';

export interface CertificateMentorDto {
  id: string;
  name: string;
}

/** Future expansion — architecture only */
export interface CertificateFutureFeaturesDto {
  pdfGenerationEnabled: boolean;
  s3Enabled: boolean;
  r2Enabled: boolean;
  verificationEnabled: boolean;
  qrCodeEnabled: boolean;
  publicVerificationUrlEnabled: boolean;
  linkedInShareEnabled: boolean;
  socialShareEnabled: boolean;
  blockchainVerificationEnabled: boolean;
}

export interface CertificateTimelineStepDto {
  id: string;
  label: string;
  description: string;
  state: 'complete' | 'current' | 'upcoming' | 'inactive';
}

export interface CertificateDto {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateNumber: string | null;
  issueDate: string | null;
  completionDate: string | null;
  mentor: CertificateMentorDto;
  /** Always null until grading/certificate grades are real */
  grade: string | null;
  /** Always null until real completion scoring exists */
  percentage: number | null;
  status: CertificateStatus;
  /** Always null until verification is enabled */
  verificationUrl: string | null;
  /** Always null until downloads are enabled */
  downloadUrl: string | null;
  timeline: CertificateTimelineStepDto[];
  futureFeatures: CertificateFutureFeaturesDto;
}

export interface CertificateStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const certificatesViewState: CertificatesViewState = 'populated';

export const certificatesPageCopy = {
  title: 'Certificates',
  description:
    'Track certificate status for completed programs. Downloads and verification will open later.',
  searchPlaceholder: 'Search certificates',
  searchLabel: 'Search by course, certificate number, or mentor',
  statusFilterLabel: 'Filter by status',
  sortLabel: 'Sort certificates',
  statsLabel: 'Certificate statistics',
  gridLabel: 'Your certificates',
  previewTitle: 'Certificate Preview',
  previewMessage:
    'Your certificate preview will appear here once certificate generation is enabled.',
  timelineTitle: 'Certificate Journey',
  viewCertificate: 'View Certificate',
  downloadPdf: 'Download PDF',
  comingSoon: 'Coming Soon',
  emptyTitle: 'No certificates yet',
  emptyDescription:
    'When you complete a program, certificate status will appear here with issuance and verification details.',
  errorTitle: 'Unable to load certificates',
  errorDescription: 'Something went wrong while loading certificates. Please try again.',
  courseLabel: 'Course',
  numberLabel: 'Certificate number',
  completionLabel: 'Completion date',
  issueLabel: 'Issue date',
  mentorLabel: 'Mentor',
  gradeLabel: 'Grade',
  statusLabel: 'Status',
  numberPlaceholder: 'Number pending',
  gradePlaceholder: 'Grade unavailable',
  datePlaceholder: 'Date placeholder',
  detailsEmpty: 'Select a certificate to preview its status.',
} as const;

export const certificateStatusLabel: Record<CertificateStatus, string> = {
  issued: 'Issued',
  processing: 'Processing',
  locked: 'Locked',
};

export const certificateStatusFilterOptions: {
  value: CertificateStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'issued', label: 'Issued' },
  { value: 'processing', label: 'Processing' },
  { value: 'locked', label: 'Locked' },
];

export const certificateSortOptions: { value: CertificateSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const defaultFutureFeatures: CertificateFutureFeaturesDto = {
  pdfGenerationEnabled: false,
  s3Enabled: false,
  r2Enabled: false,
  verificationEnabled: false,
  qrCodeEnabled: false,
  publicVerificationUrlEnabled: false,
  linkedInShareEnabled: false,
  socialShareEnabled: false,
  blockchainVerificationEnabled: false,
};

const placeholderMentor: CertificateMentorDto = {
  id: 'teacher_001',
  name: 'Placeholder Instructor',
};

function buildTimeline(status: CertificateStatus): CertificateTimelineStepDto[] {
  const steps: Omit<CertificateTimelineStepDto, 'state'>[] = [
    {
      id: 'completed',
      label: 'Completed',
      description: 'Course completion recorded.',
    },
    {
      id: 'processing',
      label: 'Certificate Processing',
      description: 'Certificate generation in progress.',
    },
    {
      id: 'issued',
      label: 'Issued',
      description: 'Certificate issued to your account.',
    },
    {
      id: 'verification',
      label: 'Verification',
      description: 'Public verification will be available later.',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn Share',
      description: 'Sharing integrations are not enabled yet.',
    },
  ];

  return steps.map((step) => {
    if (step.id === 'verification' || step.id === 'linkedin') {
      return { ...step, state: 'inactive' as const };
    }

    if (status === 'locked') {
      if (step.id === 'completed') {
        return { ...step, state: 'upcoming' as const };
      }
      return { ...step, state: 'upcoming' as const };
    }

    if (status === 'processing') {
      if (step.id === 'completed') {
        return { ...step, state: 'complete' as const };
      }
      if (step.id === 'processing') {
        return { ...step, state: 'current' as const };
      }
      return { ...step, state: 'upcoming' as const };
    }

    // issued
    if (step.id === 'completed' || step.id === 'processing' || step.id === 'issued') {
      return { ...step, state: 'complete' as const };
    }
    return { ...step, state: 'upcoming' as const };
  });
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function createCertificate(input: {
  id: string;
  courseId: string;
  courseTitle: string;
  status: CertificateStatus;
  certificateNumber: string | null;
  issueDate: string | null;
  completionDate: string | null;
}): CertificateDto {
  return {
    id: input.id,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    certificateNumber: input.certificateNumber,
    issueDate: input.issueDate,
    completionDate: input.completionDate,
    mentor: placeholderMentor,
    grade: null,
    percentage: null,
    status: input.status,
    verificationUrl: null,
    downloadUrl: null,
    timeline: buildTimeline(input.status),
    futureFeatures: defaultFutureFeatures,
  };
}

/**
 * Status catalog only — not a gallery of fabricated certificate assets.
 * issued entries expose number/dates as metadata placeholders; URLs remain null.
 */
export const certificates: CertificateDto[] = [
  createCertificate({
    id: 'cert_001',
    courseId: 'course_003',
    courseTitle: 'Handwriting Improvement',
    status: 'issued',
    certificateNumber: 'CERT-PLACEHOLDER-001',
    issueDate: daysAgo(3),
    completionDate: daysAgo(5),
  }),
  createCertificate({
    id: 'cert_002',
    courseId: 'course_001',
    courseTitle: 'Graphology Foundations',
    status: 'processing',
    certificateNumber: null,
    issueDate: null,
    completionDate: daysAgo(1),
  }),
  createCertificate({
    id: 'cert_003',
    courseId: 'course_002',
    courseTitle: 'Advanced Graphology',
    status: 'locked',
    certificateNumber: null,
    issueDate: null,
    completionDate: null,
  }),
];

export function getCertificateStats(
  items: CertificateDto[] = certificates,
): CertificateStatDto[] {
  const issued = items.filter((item) => item.status === 'issued').length;
  const processing = items.filter((item) => item.status === 'processing').length;
  const locked = items.filter((item) => item.status === 'locked').length;
  const completedCourses = items.filter(
    (item) => item.status === 'issued' || item.status === 'processing',
  ).length;

  return [
    {
      id: 'completed',
      label: 'Completed Courses',
      value: String(completedCourses),
      helper: 'Eligible for certificate flow',
    },
    {
      id: 'issued',
      label: 'Certificates Issued',
      value: String(issued),
      helper: 'Metadata only — downloads later',
    },
    {
      id: 'processing',
      label: 'Processing',
      value: String(processing),
      helper: 'Awaiting generation',
    },
    {
      id: 'locked',
      label: 'Locked',
      value: String(locked),
      helper: 'Complete course to unlock',
    },
  ];
}

export function filterCertificates(
  items: CertificateDto[],
  query: string,
  status: CertificateStatusFilter,
): CertificateDto[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesStatus = status === 'all' || item.status === status;
    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      item.courseTitle.toLowerCase().includes(normalized) ||
      (item.certificateNumber?.toLowerCase().includes(normalized) ?? false) ||
      item.mentor.name.toLowerCase().includes(normalized)
    );
  });
}

export function sortCertificates(
  items: CertificateDto[],
  sort: CertificateSortOption,
): CertificateDto[] {
  const next = [...items];
  const sortKey = (item: CertificateDto): number => {
    const iso = item.issueDate ?? item.completionDate;
    return iso ? new Date(iso).getTime() : 0;
  };

  if (sort === 'oldest') {
    return next.sort((a, b) => sortKey(a) - sortKey(b));
  }
  return next.sort((a, b) => sortKey(b) - sortKey(a));
}

export function formatCertificateDate(iso: string | null): string {
  return formatDashboardDate(iso, certificatesPageCopy.datePlaceholder);
}

export function getCertificateById(
  id: string,
  items: CertificateDto[] = certificates,
): CertificateDto | null {
  return items.find((item) => item.id === id) ?? null;
}
