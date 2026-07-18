import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

import { PaymentApi } from './payment';

describe('PaymentApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('getConfig and getCatalog call expected paths', async () => {
    apiFetchMock.mockResolvedValueOnce({
      configured: true,
      publicKey: 'rzp_test_key',
      currency: 'INR',
    });
    apiFetchMock.mockResolvedValueOnce({
      currency: 'INR',
      courses: [],
      plans: [],
    });

    await expect(PaymentApi.getConfig()).resolves.toMatchObject({
      configured: true,
      publicKey: 'rzp_test_key',
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/config');

    await PaymentApi.getCatalog('org-1');
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/catalog?organizationId=org-1');
  });

  it('createOrder sends Idempotency-Key and never includes amount', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 'ord-1',
      organizationId: 'org-1',
      purpose: 'COURSE_PURCHASE',
      status: 'CREATED',
      totalMinor: 90000,
      currency: 'INR',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    const input = {
      organizationId: 'org-1',
      purpose: 'COURSE_PURCHASE' as const,
      courseId: 'course-1',
      batchId: 'batch-1',
      couponCode: 'SAVE10',
    };

    await PaymentApi.createOrder(input, 'idem-123');

    expect(apiFetchMock).toHaveBeenCalledWith('/payments/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'idem-123' },
      body: JSON.stringify(input),
    });
    const createCall = apiFetchMock.mock.calls[0]?.[1] as
      { method?: string; headers?: Record<string, string>; body?: string } | undefined;
    expect(JSON.parse(createCall?.body ?? '{}')).not.toHaveProperty('amount');
    expect(JSON.parse(createCall?.body ?? '{}')).not.toHaveProperty('totalMinor');
  });

  it('verifyPayment posts provider identifiers without logging extras', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 'ord-1',
      organizationId: 'org-1',
      purpose: 'COURSE_PURCHASE',
      status: 'PAID',
      totalMinor: 90000,
      currency: 'INR',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      paidAt: '2026-07-01T00:01:00.000Z',
    });

    const body = {
      organizationId: 'org-1',
      orderId: 'ord-1',
      providerOrderId: 'order_rzp',
      providerPaymentId: 'pay_rzp',
      signature: 'sig_value',
    };

    await PaymentApi.verifyPayment(body);
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  });

  it('lists organization-scoped student resources with pagination', async () => {
    apiFetchMock.mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    await PaymentApi.getOrders({ organizationId: 'org-1', page: 2, limit: 10 });
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/payments/orders?organizationId=org-1&page=2&limit=10',
    );

    await PaymentApi.getHistory({ organizationId: 'org-1', search: 'INV' });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/history?organizationId=org-1&search=INV');

    await PaymentApi.getInvoices({ organizationId: 'org-1' });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/invoices?organizationId=org-1');

    await PaymentApi.getInvoice('inv-1', 'org-1');
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/invoices/inv-1?organizationId=org-1');

    apiFetchMock.mockResolvedValueOnce(null);
    await expect(PaymentApi.getCurrentSubscription('org-1')).resolves.toBeNull();
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/payments/subscriptions/current?organizationId=org-1',
    );
  });

  it('covers admin plan, refund, assign, coupon, and retry mutations', async () => {
    apiFetchMock.mockResolvedValue({
      id: 'plan-1',
      organizationId: 'org-1',
      name: 'Pro',
      priceMinor: 99900,
      currency: 'INR',
      interval: 'MONTHLY',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    await PaymentApi.getAdminOverview('org-1');
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/overview?organizationId=org-1');

    await PaymentApi.createPlan({
      organizationId: 'org-1',
      name: 'Pro',
      priceMinor: 99900,
      currency: 'INR',
      interval: 'monthly',
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/plans', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        name: 'Pro',
        priceMinor: 99900,
        currency: 'INR',
        interval: 'monthly',
      }),
    });

    await PaymentApi.updatePlan('plan-1', { isActive: false });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/plans/plan-1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });

    apiFetchMock.mockResolvedValue({
      id: 'rf-1',
      organizationId: 'org-1',
      orderId: 'ord-1',
      status: 'PENDING',
      amountMinor: 500,
      currency: 'INR',
      createdAt: '2026-07-01T00:00:00.000Z',
    });

    await PaymentApi.createRefund({
      organizationId: 'org-1',
      orderId: 'ord-1',
      amountMinor: 500,
      reason: 'Duplicate',
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/refunds', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        orderId: 'ord-1',
        amountMinor: 500,
        reason: 'Duplicate',
      }),
    });

    apiFetchMock.mockResolvedValue({
      id: 'sub-1',
      organizationId: 'org-1',
      planId: 'plan-1',
      status: 'ACTIVE',
      priceMinor: 99900,
      currency: 'INR',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    await PaymentApi.assignSubscription({
      organizationId: 'org-1',
      planId: 'plan-1',
      userId: 'user-1',
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/subscriptions/assign', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        planId: 'plan-1',
        userId: 'user-1',
      }),
    });

    apiFetchMock.mockResolvedValue({
      id: 'cp-1',
      organizationId: 'org-1',
      code: 'SAVE10',
      discountType: 'PERCENT',
      discountValue: 10,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    await PaymentApi.createCoupon({
      organizationId: 'org-1',
      code: 'SAVE10',
      discountType: 'percent',
      discountValue: 10,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        code: 'SAVE10',
        discountType: 'percent',
        discountValue: 10,
      }),
    });

    await PaymentApi.updateCoupon('cp-1', { isActive: false });
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/coupons/cp-1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });

    apiFetchMock.mockResolvedValue({
      id: 'ord-1',
      organizationId: 'org-1',
      purpose: 'COURSE_PURCHASE',
      status: 'CREATED',
      totalMinor: 1000,
      currency: 'INR',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    await PaymentApi.retryOrder('ord-1', 'org-1');
    expect(apiFetchMock).toHaveBeenCalledWith('/payments/admin/orders/ord-1/retry', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org-1' }),
    });
  });
});
