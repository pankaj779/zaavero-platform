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

import { AssignmentApi } from './assignment';

describe('AssignmentApi', () => {
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
          studentsEnrolled: 18,
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getAssignments maps payload and enriches course/batch', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          courseId: '33333333-3333-4333-8333-333333333333',
          batchId: '44444444-4444-4444-8444-444444444444',
          title: 'Reflection Essay',
          instructions: null,
          status: 'PUBLISHED',
          maxScore: 100,
          dueAt: '2026-08-01T18:00:00.000Z',
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-02T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await AssignmentApi.getAssignments({
      search: 'essay',
      status: 'PUBLISHED',
      courseId: '33333333-3333-4333-8333-333333333333',
      sortBy: 'dueAt',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/assignments?courseId=33333333-3333-4333-8333-333333333333&status=PUBLISHED&search=essay&page=1&limit=20&sortBy=dueAt&sortOrder=asc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('published');
    expect(result.items[0]?.course.title).toBe('Foundations');
    expect(result.items[0]?.batches[0]?.name).toBe('Weekend Cohort');
    expect(result.items[0]?.grading.maxScore).toBe(100);
    expect(result.items[0]?.submissions.submissionRate).toBe(0);
    expect(result.meta.total).toBe(1);
  });

  it('getAssignment / create / update / delete return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      courseId: '33333333-3333-4333-8333-333333333333',
      batchId: null,
      title: 'Practice Set',
      instructions: 'Do the work',
      status: 'DRAFT',
      maxScore: 50,
      dueAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
      deletedAt: null,
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(AssignmentApi.getAssignment(record.id)).resolves.toMatchObject({
      id: record.id,
      status: 'draft',
      submissions: { submissionRate: null },
      batches: [],
    });

    await AssignmentApi.createAssignment({
      organizationId: record.organizationId,
      courseId: record.courseId,
      title: record.title,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/assignments', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        courseId: record.courseId,
        title: record.title,
      }),
    });

    await AssignmentApi.updateAssignment(record.id, { title: 'Updated' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/assignments/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    await AssignmentApi.deleteAssignment(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/assignments/${record.id}`, {
      method: 'DELETE',
    });
  });
});
