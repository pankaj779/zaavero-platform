import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock, getCourseMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getCourseMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./course', () => ({
  CourseApi: {
    getCourse: getCourseMock,
  },
}));

import { LessonApi } from './lesson';

describe('LessonApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getCourseMock.mockReset();
    getCourseMock.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'handwriting-foundations',
      title: 'Handwriting Foundations',
    });
  });

  it('getLessons maps paginated payload and enriches course when courseId is set', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          moduleId: '44444444-4444-4444-8444-444444444444',
          title: 'Welcome Lesson',
          description: null,
          contentType: 'VIDEO',
          contentUrl: null,
          durationSeconds: 120,
          displayOrder: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const courseId = '33333333-3333-4333-8333-333333333333';
    const result = await LessonApi.getLessons({
      search: 'welcome',
      contentType: 'VIDEO',
      courseId,
      sortBy: 'title',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/lessons?courseId=${courseId}&contentType=VIDEO&search=welcome&page=1&limit=20&sortBy=title&sortOrder=asc`,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.contentType).toBe('video');
    expect(result.items[0]?.course.title).toBe('Handwriting Foundations');
    expect(result.items[0]?.attachmentCount).toBe(0);
    expect(result.meta.total).toBe(1);
  });

  it('getLesson / createLesson / updateLesson / deleteLesson return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      moduleId: '44444444-4444-4444-8444-444444444444',
      title: 'Quiz Lesson',
      description: 'Check understanding',
      contentType: 'QUIZ',
      contentUrl: null,
      durationSeconds: null,
      displayOrder: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(LessonApi.getLesson(record.id)).resolves.toMatchObject({
      id: record.id,
      contentType: 'quiz',
      course: { title: 'Course' },
    });

    await LessonApi.createLesson({
      organizationId: record.organizationId,
      moduleId: record.moduleId,
      title: record.title,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/lessons', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        moduleId: record.moduleId,
        title: record.title,
      }),
    });

    await LessonApi.updateLesson(record.id, { title: 'Updated' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/lessons/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    await LessonApi.deleteLesson(record.id);
    expect(apiFetchMock).toHaveBeenCalledWith(`/lessons/${record.id}`, {
      method: 'DELETE',
    });
  });
});
