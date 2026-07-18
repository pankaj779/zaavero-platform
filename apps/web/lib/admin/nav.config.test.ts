import { describe, expect, it } from 'vitest';
import { ADMIN_ROUTES } from '../constants/routes';
import { adminNavItems, getAdminPageMeta } from './nav.config';

describe('admin nav config', () => {
  it('covers every admin route with a nav destination or academic child', () => {
    const hrefs = new Set(adminNavItems.map((item) => item.href));
    expect(hrefs.has(ADMIN_ROUTES.dashboard)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.users)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.teachers)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.students)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.academic)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.organization)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.roles)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.analytics)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.payments)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.notifications)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.auditLogs)).toBe(true);
    expect(hrefs.has(ADMIN_ROUTES.settings)).toBe(true);
  });

  it('resolves page meta for academic child routes and payments', () => {
    expect(getAdminPageMeta(ADMIN_ROUTES.courses).title).toBe('Courses');
    expect(getAdminPageMeta(ADMIN_ROUTES.payments).title).toBe('Payments');
    expect(getAdminPageMeta('/admin/unknown').title).toBe('Admin Dashboard');
  });
});
