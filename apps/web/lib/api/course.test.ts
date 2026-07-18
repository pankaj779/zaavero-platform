import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

import { CourseApi } from './course';

describe('CourseApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('getCourses maps paginated API payload to teacher DTOs', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          teacherId: '33333333-3333-4333-8333-333333333333',
          title: 'Handwriting Foundations',
          slug: 'handwriting-foundations',
          description: null,
          difficulty: 'BEGINNER',
          status: 'DRAFT',
          language: 'en',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await CourseApi.getCourses({
      search: 'hand',
      status: 'DRAFT',
      sortBy: 'title',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/courses?search=hand&status=DRAFT&page=1&limit=20&sortBy=title&sortOrder=asc',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('draft');
    expect(result.items[0]?.description).toBe('');
    expect(result.meta.total).toBe(1);
  });

  it('getCourse / createCourse / updateCourse / deleteCourse return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      teacherId: '33333333-3333-4333-8333-333333333333',
      title: 'Advanced Analysis',
      slug: 'advanced-analysis',
      description: 'Deep dive',
      difficulty: 'ADVANCED',
      status: 'PUBLISHED',
      language: 'en',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(CourseApi.getCourse(record.id)).resolves.toMatchObject({
      id: record.id,
      status: 'published',
      isPublished: true,
    });
    expect(apiFetchMock).toHaveBeenCalledWith(`/courses/${record.id}`);

    await CourseApi.createCourse({
      organizationId: record.organizationId,
      title: record.title,
      slug: record.slug,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/courses', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        title: record.title,
        slug: record.slug,
      }),
    });

    await CourseApi.updateCourse(record.id, { title: 'Updated' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/courses/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    await CourseApi.deleteCourse(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/courses/${record.id}`, {
      method: 'DELETE',
    });
  });
});
