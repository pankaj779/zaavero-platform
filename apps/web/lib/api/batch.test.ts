import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock, getCoursesMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getCoursesMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./course', () => ({
  CourseApi: {
    getCourses: getCoursesMock,
  },
}));

import { BatchApi } from './batch';

describe('BatchApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getCoursesMock.mockReset();
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
  });

  it('getBatches maps paginated API payload and enriches course titles', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          courseId: '33333333-3333-4333-8333-333333333333',
          teacherId: '44444444-4444-4444-8444-444444444444',
          name: 'Morning Cohort',
          status: 'UPCOMING',
          startDate: '2026-08-01T00:00:00.000Z',
          endDate: null,
          maxStudents: 20,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await BatchApi.getBatches({
      search: 'morning',
      status: 'UPCOMING',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/batches?search=morning&status=UPCOMING&page=1&limit=20&sortBy=name&sortOrder=asc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('upcoming');
    expect(result.items[0]?.course.title).toBe('Handwriting Foundations');
    expect(result.meta.total).toBe(1);
  });

  it('skips course enrichment when enrichCourses is false', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          courseId: '33333333-3333-4333-8333-333333333333',
          teacherId: '44444444-4444-4444-8444-444444444444',
          name: 'Morning Cohort',
          status: 'ACTIVE',
          startDate: '2026-08-01T00:00:00.000Z',
          endDate: null,
          maxStudents: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await BatchApi.getBatches({ enrichCourses: false });

    expect(getCoursesMock).not.toHaveBeenCalled();
    expect(result.items[0]?.course.title).toBe('Course');
  });

  it('getBatch / createBatch / updateBatch / deleteBatch return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      courseId: '33333333-3333-4333-8333-333333333333',
      teacherId: '44444444-4444-4444-8444-444444444444',
      name: 'Evening Cohort',
      status: 'COMPLETED',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-03-01T00:00:00.000Z',
      maxStudents: 16,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(BatchApi.getBatch(record.id)).resolves.toMatchObject({
      id: record.id,
      status: 'completed',
    });
    expect(apiFetchMock).toHaveBeenCalledWith(`/batches/${record.id}`);

    await BatchApi.createBatch({
      organizationId: record.organizationId,
      courseId: record.courseId,
      name: record.name,
      startDate: record.startDate,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/batches', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        courseId: record.courseId,
        name: record.name,
        startDate: record.startDate,
      }),
    });

    await BatchApi.updateBatch(record.id, { name: 'Updated' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/batches/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });

    await BatchApi.deleteBatch(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/batches/${record.id}`, {
      method: 'DELETE',
    });
  });
});
