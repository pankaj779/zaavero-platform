import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

import { AnalyticsApi } from './analytics';

function emptyPage() {
  return {
    items: [],
    meta: { total: 0, page: 1, limit: 100, totalPages: 1 },
  };
}

describe('AnalyticsApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('aggregates existing organization-scoped modules into an analytics overview', async () => {
    apiFetchMock.mockImplementation((path: string) => {
      if (path.startsWith('/courses')) {
        return Promise.resolve({
          items: [
            {
              id: 'course-1',
              organizationId: 'org-1',
              title: 'Foundations',
              slug: 'foundations',
              description: null,
              difficulty: 'BEGINNER',
              status: 'PUBLISHED',
              language: 'en',
              teacherId: 'teacher-1',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-07-01T00:00:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
        });
      }
      if (path.startsWith('/enrollments')) {
        return Promise.resolve({
          items: [
            {
              id: 'enr-1',
              organizationId: 'org-1',
              courseId: 'course-1',
              batchId: 'batch-1',
              studentId: 'student-1',
              status: 'ACTIVE',
              enrolledAt: '2026-06-01T00:00:00.000Z',
              completedAt: null,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-07-01T00:00:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
        });
      }
      return Promise.resolve(emptyPage());
    });

    const overview = await AnalyticsApi.getOverview({
      organizationId: 'org-1',
      timeRange: '30d',
    });

    expect(overview.kpis.find((kpi) => kpi.id === 'kpi-active-courses')?.value).toBe('1');
    expect(overview.kpis.find((kpi) => kpi.id === 'kpi-total-students')?.value).toBe('1');
    expect(overview.kpis.find((kpi) => kpi.id === 'kpi-student-satisfaction')?.value).toBe('—');
    expect(overview.courses[0]?.title).toBe('Foundations');
  });
});
