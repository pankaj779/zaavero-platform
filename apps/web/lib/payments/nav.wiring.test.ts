import { describe, expect, it } from 'vitest';
import { ADMIN_ROUTES, DASHBOARD_ROUTES, getPaymentReceiptPath } from '../constants';
import { adminNavItems } from '../admin/nav.config';
import { dashboardNavItems } from '../dashboard/nav.config';

describe('payment routes and nav wiring', () => {
  it('exposes student and admin payment destinations', () => {
    expect(DASHBOARD_ROUTES.payments).toBe('/dashboard/payments');
    expect(ADMIN_ROUTES.payments).toBe('/admin/payments');
    expect(getPaymentReceiptPath('inv-123')).toBe('/dashboard/payments/receipts/inv-123');
    expect(dashboardNavItems.find((item) => item.id === 'payments')?.icon).toBe('creditCard');
    expect(adminNavItems.find((item) => item.id === 'payments')?.href).toBe(ADMIN_ROUTES.payments);
  });
});
