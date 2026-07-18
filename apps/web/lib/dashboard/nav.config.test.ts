import { describe, expect, it } from 'vitest';
import { DASHBOARD_ROUTES } from '../constants/routes';
import { dashboardNavItems, dashboardPageMeta, getDashboardPageMeta } from './nav.config';

const EXPECTED_NAV_LABELS = [
  'Dashboard',
  'My Courses',
  'My Progress',
  'Live Classes',
  'Assignments',
  'Attendance',
  'Certificates',
  'Payments',
  'Calendar',
  'Notifications',
  'Messages',
  'Profile',
  'Settings',
] as const;

describe('student dashboard nav config', () => {
  it('includes every Student Portal destination in blueprint order', () => {
    expect(dashboardNavItems.map((item) => item.label)).toEqual([...EXPECTED_NAV_LABELS]);
  });

  it('includes Payments in student navigation with metadata', () => {
    expect(dashboardNavItems.some((item) => item.id === 'payments')).toBe(true);
    expect(DASHBOARD_ROUTES.payments).toBe('/dashboard/payments');
    expect(dashboardPageMeta[DASHBOARD_ROUTES.payments]?.title).toBe('Payments');
    expect(getDashboardPageMeta('/dashboard/payments/receipts/inv-1').breadcrumb).toBe('Receipt');
  });

  it('exposes progress and attendance routes with meta', () => {
    expect(DASHBOARD_ROUTES.progress).toBe('/dashboard/progress');
    expect(DASHBOARD_ROUTES.attendance).toBe('/dashboard/attendance');
    expect(dashboardNavItems.find((item) => item.id === 'progress')?.href).toBe(
      DASHBOARD_ROUTES.progress,
    );
    expect(dashboardNavItems.find((item) => item.id === 'attendance')?.href).toBe(
      DASHBOARD_ROUTES.attendance,
    );
    expect(dashboardPageMeta[DASHBOARD_ROUTES.progress]?.title).toBe('My Progress');
    expect(dashboardPageMeta[DASHBOARD_ROUTES.attendance]?.title).toBe('Attendance');
  });

  it('has page metadata for every nav destination', () => {
    for (const item of dashboardNavItems) {
      expect(dashboardPageMeta[item.href]?.title).toBeTruthy();
      expect(dashboardPageMeta[item.href]?.breadcrumb).toBeTruthy();
    }
  });

  it('routes engagement modules under dashboard paths', () => {
    expect(DASHBOARD_ROUTES.calendar).toBe('/dashboard/calendar');
    expect(DASHBOARD_ROUTES.messages).toBe('/dashboard/messages');
    expect(DASHBOARD_ROUTES.notifications).toBe('/dashboard/notifications');
    expect(getDashboardPageMeta(DASHBOARD_ROUTES.calendar).title).toBe('Calendar');
    expect(getDashboardPageMeta(DASHBOARD_ROUTES.messages).description).not.toMatch(/coming soon/i);
    expect(getDashboardPageMeta(DASHBOARD_ROUTES.notifications).description).not.toMatch(
      /disabled until/i,
    );
  });
});
