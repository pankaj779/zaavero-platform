import { apiFetch } from '../auth/api-client';
import type { StudentCertificateDto } from '../teacher/certificate-types';
import { BatchApi } from './batch';
import {
  collectCertificateTemplateIds,
  mapCertificateApiList,
  mapCertificateApiToTeacherSummary,
  mapPublicCertificateVerification,
  type CertificateApiRecord,
  type CertificateBatchLookup,
  type CertificateCourseLookup,
  type CertificateListMeta,
  type CertificateListResult,
  type PublicCertificateVerificationApiRecord,
  type PublicCertificateVerificationDto,
} from './certificate-mapper';
import { CourseApi } from './course';

export interface ListCertificatesParams {
  organizationId?: string;
  studentId?: string;
  courseId?: string;
  batchId?: string;
  status?: 'ELIGIBLE' | 'PENDING' | 'ISSUED' | 'REVOKED';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'issuedAt' | 'certificateNumber' | 'status';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course/batch titles from related APIs. */
  enrichLookups?: boolean;
}

export interface IssueCertificateInput {
  organizationId: string;
  studentId: string;
  courseId: string;
  batchId?: string | null;
  templateId?: string | null;
  pdfUrl?: string | null;
}

interface PaginatedCertificatesApiPayload {
  items: CertificateApiRecord[];
  meta: CertificateListMeta;
}

function buildQuery(params: ListCertificatesParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.studentId) {
    query.set('studentId', params.studentId);
  }
  if (params.courseId) {
    query.set('courseId', params.courseId);
  }
  if (params.batchId) {
    query.set('batchId', params.batchId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }

  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

async function buildLookups(organizationId: string | undefined): Promise<{
  courses: ReadonlyMap<string, CertificateCourseLookup>;
  batches: ReadonlyMap<string, CertificateBatchLookup>;
}> {
  try {
    const [courses, batches] = await Promise.all([
      CourseApi.getCourses({
        organizationId,
        page: 1,
        limit: 100,
        sortBy: 'title',
        sortOrder: 'asc',
      }),
      BatchApi.getBatches({
        organizationId,
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        enrichCourses: false,
      }),
    ]);

    return {
      courses: new Map(
        courses.items.map((course) => [
          course.id,
          { id: course.id, slug: course.slug, title: course.title },
        ]),
      ),
      batches: new Map(
        batches.items.map((batch) => [batch.id, { id: batch.id, name: batch.name }]),
      ),
    };
  } catch {
    return { courses: new Map(), batches: new Map() };
  }
}

/**
 * Certificate API client — all NestJS certificate calls go through here.
 * Components must never call fetch directly.
 */
export const CertificateApi = {
  async getCertificates(params: ListCertificatesParams = {}): Promise<CertificateListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedCertificatesApiPayload>(
      `/certificates${buildQuery(listParams)}`,
    );

    const lookups = enrichLookups ? await buildLookups(listParams.organizationId) : undefined;

    return {
      items: mapCertificateApiList(payload.items, lookups),
      meta: payload.meta,
      templateIds: collectCertificateTemplateIds(payload.items),
    };
  },

  async getCertificate(id: string): Promise<StudentCertificateDto> {
    const record = await apiFetch<CertificateApiRecord>(`/certificates/${id}`);
    const lookups = await buildLookups(record.organizationId);
    return mapCertificateApiToTeacherSummary(record, lookups);
  },

  async verifyCertificate(verificationCode: string): Promise<StudentCertificateDto> {
    const record = await apiFetch<CertificateApiRecord>(
      `/certificates/verify/${encodeURIComponent(verificationCode)}`,
    );
    const lookups = await buildLookups(record.organizationId);
    return mapCertificateApiToTeacherSummary(record, lookups);
  },

  async verifyPublicCertificate(
    verificationCode: string,
  ): Promise<PublicCertificateVerificationDto> {
    const record = await apiFetch<PublicCertificateVerificationApiRecord>(
      `/public/certificates/verify/${encodeURIComponent(verificationCode)}`,
      { skipAuth: true },
    );
    return mapPublicCertificateVerification(record);
  },

  async issueCertificate(input: IssueCertificateInput): Promise<StudentCertificateDto> {
    const record = await apiFetch<CertificateApiRecord>('/certificates/issue', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapCertificateApiToTeacherSummary(record);
  },

  async revokeCertificate(id: string): Promise<StudentCertificateDto> {
    const record = await apiFetch<CertificateApiRecord>(`/certificates/${id}/revoke`, {
      method: 'POST',
    });
    return mapCertificateApiToTeacherSummary(record);
  },

  async regenerateCertificatePdf(id: string): Promise<StudentCertificateDto> {
    const record = await apiFetch<CertificateApiRecord>(
      `/certificates/${encodeURIComponent(id)}/regenerate-pdf`,
      { method: 'POST' },
    );
    return mapCertificateApiToTeacherSummary(record);
  },
};
