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

import { EnrollmentApi } from './enrollment';

describe('EnrollmentApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getCoursesMock.mockReset();
    getBatchesMock.mockReset();
    getCoursesMock.mockResolvedValue({
      items: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          slug: 'handwriting-foundations',
          title: 'Handwriting Foundations',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    getBatchesMock.mockResolvedValue({
      items: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Morning Cohort',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getEnrollments maps paginated payload and enriches course/batch', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          courseId: '33333333-3333-4333-8333-333333333333',
          batchId: '44444444-4444-4444-8444-444444444444',
          studentId: '55555555-5555-4555-8555-555555555555',
          status: 'ACTIVE',
          enrolledAt: '2026-07-01T09:00:00.000Z',
          completedAt: null,
          createdAt: '2026-07-01T09:00:00.000Z',
          updatedAt: '2026-07-15T10:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await EnrollmentApi.getEnrollments({
      search: 'ada',
      status: 'ACTIVE',
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/enrollments?search=ada&status=ACTIVE&page=1&limit=20&sortBy=enrolledAt&sortOrder=desc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.enrollmentStatus).toBe('active');
    expect(result.items[0]?.course.title).toBe('Handwriting Foundations');
    expect(result.items[0]?.batch.name).toBe('Morning Cohort');
    expect(result.meta.total).toBe(1);
  });

  it('skips enrichment when enrichLookups is false', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          courseId: '33333333-3333-4333-8333-333333333333',
          batchId: '44444444-4444-4444-8444-444444444444',
          studentId: '55555555-5555-4555-8555-555555555555',
          status: 'COMPLETED',
          enrolledAt: '2026-07-01T09:00:00.000Z',
          completedAt: '2026-08-01T09:00:00.000Z',
          createdAt: '2026-07-01T09:00:00.000Z',
          updatedAt: '2026-08-01T09:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await EnrollmentApi.getEnrollments({ enrichLookups: false });

    expect(getCoursesMock).not.toHaveBeenCalled();
    expect(getBatchesMock).not.toHaveBeenCalled();
    expect(result.items[0]?.course.title).toBe('Course');
    expect(result.items[0]?.batch.name).toBe('Batch');
  });

  it('getEnrollment / createEnrollment / updateEnrollment / deleteEnrollment return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      courseId: '33333333-3333-4333-8333-333333333333',
      batchId: '44444444-4444-4444-8444-444444444444',
      studentId: '55555555-5555-4555-8555-555555555555',
      status: 'SUSPENDED',
      enrolledAt: '2026-07-01T09:00:00.000Z',
      completedAt: null,
      createdAt: '2026-07-01T09:00:00.000Z',
      updatedAt: '2026-07-15T10:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(EnrollmentApi.getEnrollment(record.id)).resolves.toMatchObject({
      id: record.id,
      enrollmentStatus: 'inactive',
    });
    expect(apiFetchMock).toHaveBeenCalledWith(`/enrollments/${record.id}`);

    await EnrollmentApi.createEnrollment({
      organizationId: record.organizationId,
      courseId: record.courseId,
      batchId: record.batchId,
      studentId: record.studentId,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/enrollments', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        courseId: record.courseId,
        batchId: record.batchId,
        studentId: record.studentId,
      }),
    });

    await EnrollmentApi.updateEnrollment(record.id, { status: 'ACTIVE' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/enrollments/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    await EnrollmentApi.deleteEnrollment(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/enrollments/${record.id}`, {
      method: 'DELETE',
    });
  });
});
