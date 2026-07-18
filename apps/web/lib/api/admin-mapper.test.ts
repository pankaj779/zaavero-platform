import { describe, expect, it } from 'vitest';
import {
  mapAdminOrganization,
  mapAdminOverview,
  mapAdminPermissions,
  mapAdminRole,
  mapAdminUser,
  mapAdminUserList,
  mapAdminAuditList,
} from './admin-mapper';

describe('admin mapper', () => {
  it('maps users with derived display fields', () => {
    const dto = mapAdminUser({
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
      roles: [{ id: 'r1', name: 'Admin', description: null, isSystem: true }],
      teacherProfile: null,
      studentProfile: null,
    });

    expect(dto.fullName).toBe('Ada Lovelace');
    expect(dto.initials).toBe('AL');
  });

  it('maps user lists and roles', () => {
    const list = mapAdminUserList({
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
    expect(list.items).toHaveLength(1);
    expect(
      mapAdminRole({ id: 'r1', name: 'Teacher', description: null, isSystem: true }).permissions,
    ).toEqual([]);
    expect(
      mapAdminPermissions([
        { id: 'p1', name: 'course:create', module: 'course', description: null },
      ]),
    ).toHaveLength(1);
  });

  it('maps organization counts from prisma _count', () => {
    const org = mapAdminOrganization({
      id: 'o1',
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
      _count: { members: 3, courses: 2, batches: 1 },
    });
    expect(org.counts).toEqual({ members: 3, courses: 2, batches: 1 });
    expect(org).not.toHaveProperty('_count');
  });

  it('maps overview and audit payloads', () => {
    const overview = mapAdminOverview({
      organizationId: 'o1',
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
    expect(overview.revenue).toBeNull();
    expect(
      mapAdminAuditList({
        items: [
          {
            id: 'a1',
            action: 'USER_CREATE',
            entity: 'User',
            entityId: 'u1',
            ipAddress: null,
            userAgent: null,
            metadata: null,
            createdAt: '2026-07-18T00:00:00.000Z',
            user: null,
          },
        ],
        meta: { total: 1, page: 1, limit: 25, totalPages: 1 },
      }).items,
    ).toHaveLength(1);
  });
});
