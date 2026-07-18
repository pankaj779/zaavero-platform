import type {
  CertificateSortField,
  CertificateStatusValue,
} from '../constants/certificate.constants';

export interface CertificateRecord {
  id: string;
  organizationId: string;
  studentId: string;
  courseId: string;
  batchId: string | null;
  templateId: string | null;
  status: CertificateStatusValue;
  certificateNumber: string;
  verificationCode: string;
  pdfUrl: string | null;
  issuedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateListFilters {
  organizationId: string;
  studentId?: string;
  courseId?: string;
  batchId?: string;
  status?: CertificateStatusValue;
  search?: string;
  page: number;
  limit: number;
  sortBy: CertificateSortField;
  sortOrder: 'asc' | 'desc';
}

export interface CertificateListResult {
  items: CertificateRecord[];
  total: number;
}

export interface IssueCertificateData {
  organizationId: string;
  studentId: string;
  courseId: string;
  batchId?: string | null;
  templateId?: string | null;
  pdfUrl?: string | null;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: Date;
}

export interface UpdateCertificateData {
  templateId?: string | null;
  pdfUrl?: string | null;
  status?: CertificateStatusValue;
}

export interface CourseContextRecord {
  id: string;
  organizationId: string;
  teacherId: string;
}

export interface BatchContextRecord {
  id: string;
  organizationId: string;
  courseId: string;
}

export interface CertificateRepository {
  readonly marker: 'certificate-repository';

  findById(id: string): Promise<CertificateRecord | null>;

  findByVerificationCode(verificationCode: string): Promise<CertificateRecord | null>;

  findMany(filters: CertificateListFilters): Promise<CertificateListResult>;

  findCourseContext(courseId: string): Promise<CourseContextRecord | null>;

  findBatchContext(batchId: string): Promise<BatchContextRecord | null>;

  studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean>;

  findStudentProfileId(organizationId: string, userId: string): Promise<string | null>;

  findTeacherProfileId(organizationId: string, userId: string): Promise<string | null>;

  issue(data: IssueCertificateData): Promise<CertificateRecord>;

  update(id: string, data: UpdateCertificateData): Promise<CertificateRecord>;

  revoke(id: string, revokedAt: Date): Promise<CertificateRecord>;
}
