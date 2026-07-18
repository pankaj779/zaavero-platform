import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../auth/api-client';
import { AdminApi } from './admin';

vi.mock('../auth/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

describe('AdminApi', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('loads overview through apiFetch', async () => {
    mockedFetch.mockResolvedValueOnce({
      organizationId: 'org-1',
      generatedAt: '2026-07-18T00:00:00.000Z',
      counts: {
        users: 1,
        teachers: 1,
        students: 1,
        courses: 1,
        batches: 1,
        enrollments: 1,
        assignments: 1,
        submissions: 1,
        certificates: 1,
        attendances: 1,
        liveSessions: 1,
        notifications: 1,
      },
      revenue: null,
      recentEnrollments: [],
      recentCertificates: [],
      recentAssignments: [],
      recentActivity: [],
      systemStatus: {
        api: 'operational',
        database: 'operational',
        payments: 'not_integrated',
        email: 'not_configured',
      },
    });

    const result = await AdminApi.getOverview('org-1');
    expect(mockedFetch).toHaveBeenCalledWith('/admin/overview?organizationId=org-1');
    expect(result.counts.users).toBe(1);
  });

  it('lists users with query params', async () => {
    mockedFetch.mockResolvedValueOnce({
      items: [
        {
          id: 'u1',
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          phone: null,
          profileImage: null,
          emailVerified: true,
          lastLoginAt: null,
          isActive: true,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
          membership: { id: 'm1', status: 'ACTIVE', joinedAt: '2026-07-01T00:00:00.000Z' },
          roles: [],
          teacherProfile: null,
          studentProfile: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await AdminApi.getUsers({
      organizationId: 'org-1',
      role: 'Admin',
      page: 1,
      limit: 20,
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      '/admin/users?organizationId=org-1&role=Admin&page=1&limit=20',
    );
    expect(result.items[0]?.fullName).toBe('Ada Lovelace');
  });

  it('maps organization responses', async () => {
    mockedFetch.mockResolvedValueOnce({
      id: 'org-1',
      name: 'Graphology',
      slug: 'graphology',
      logo: null,
      website: null,
      email: null,
      phone: null,
      address: null,
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      isActive: true,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      _count: { members: 4, courses: 2, batches: 1 },
    });

    const result = await AdminApi.getOrganization('org-1');
    expect(result.counts.members).toBe(4);
  });
});
