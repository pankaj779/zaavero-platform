import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock, getCoursesMock, getBatchesMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getCoursesMock: vi.fn(),
  getBatchesMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./course', () => ({
  CourseApi: {
    getCourses: getCoursesMock,
  },
}));

vi.mock('./batch', () => ({
  BatchApi: {
    getBatches: getBatchesMock,
  },
}));

import { CertificateApi } from './certificate';

describe('CertificateApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getCoursesMock.mockReset();
    getBatchesMock.mockReset();
    getCoursesMock.mockResolvedValue({
      items: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          slug: 'foundations',
          title: 'Foundations',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    getBatchesMock.mockResolvedValue({
      items: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Weekend Cohort',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getCertificates maps payload and enriches course/batch', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          studentId: '66666666-6666-4666-8666-666666666666',
          courseId: '33333333-3333-4333-8333-333333333333',
          batchId: '44444444-4444-4444-8444-444444444444',
          templateId: '88888888-8888-4888-8888-888888888888',
          status: 'ISSUED',
          certificateNumber: 'CERT-001',
          verificationCode: 'VERIFY-001',
          pdfUrl: 'https://example.com/cert.pdf',
          issuedAt: '2026-07-10T09:00:00.000Z',
          revokedAt: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-10T09:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await CertificateApi.getCertificates({
      status: 'ISSUED',
      search: 'CERT',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/certificates?status=ISSUED&search=CERT&page=1&limit=20&sortBy=updatedAt&sortOrder=desc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('issued');
    expect(result.items[0]?.course.title).toBe('Foundations');
    expect(result.items[0]?.batch.name).toBe('Weekend Cohort');
    expect(result.items[0]?.downloadUrl).toBeNull();
    expect(result.items[0]?.verificationUrl).toBeNull();
    expect(result.templateIds.get('11111111-1111-4111-8111-111111111111')).toBe(
      '88888888-8888-4888-8888-888888888888',
    );
    expect(result.meta.total).toBe(1);
  });

  it('getCertificate / verify / issue / revoke return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      studentId: '66666666-6666-4666-8666-666666666666',
      courseId: '33333333-3333-4333-8333-333333333333',
      batchId: null,
      templateId: null,
      status: 'ELIGIBLE',
      certificateNumber: 'CERT-002',
      verificationCode: 'VERIFY-002',
      pdfUrl: null,
      issuedAt: null,
      revokedAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(CertificateApi.getCertificate(record.id)).resolves.toMatchObject({
      id: record.id,
      status: 'eligible',
      batch: { name: 'No batch' },
      student: { name: 'Student' },
    });

    await CertificateApi.verifyCertificate('VERIFY-002');
    expect(apiFetchMock).toHaveBeenCalledWith('/certificates/verify/VERIFY-002');

    await CertificateApi.issueCertificate({
      organizationId: record.organizationId,
      studentId: record.studentId,
      courseId: record.courseId,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/certificates/issue', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        studentId: record.studentId,
        courseId: record.courseId,
      }),
    });

    await CertificateApi.revokeCertificate(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/certificates/${record.id}/revoke`, {
      method: 'POST',
    });
  });
});
