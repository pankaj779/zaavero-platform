import { describe, expect, it } from 'vitest';
import {
  mapAdminOverview,
  mapCatalog,
  mapCoupon,
  mapInvoice,
  mapPaymentConfig,
  mapPaymentHistoryItem,
  mapPaymentOrder,
  mapPaymentOrderStatus,
  mapPlan,
  mapRefund,
  mapSubscription,
  mapTransaction,
} from './payment-mapper';

describe('payment-mapper', () => {
  it('maps config and treats missing public key as unset', () => {
    expect(
      mapPaymentConfig({
        configured: true,
        keyId: 'rzp_test_abc',
        currency: 'inr',
      }),
    ).toEqual({
      configured: true,
      provider: 'razorpay',
      publicKey: 'rzp_test_abc',
      currency: 'INR',
      message: null,
    });

    expect(
      mapPaymentConfig({
        configured: true,
        publicKey: null,
        message: 'Keys missing',
      }),
    ).toMatchObject({
      configured: false,
      publicKey: null,
      message: 'Keys missing',
    });
  });

  it('maps order money from minor units without leaking raw provider secrets', () => {
    const order = mapPaymentOrder({
      id: 'ord-1',
      organizationId: 'org-1',
      purpose: 'COURSE_PURCHASE',
      status: 'CREATED',
      currency: 'INR',
      subtotalMinor: 100000,
      discountMinor: 10000,
      taxMinor: 0,
      totalMinor: 90000,
      lines: [{ label: 'Course', amountMinor: 100000, currency: 'INR' }],
      courseId: 'course-1',
      batchId: 'batch-1',
      planId: null,
      couponCode: 'SAVE10',
      providerOrderId: 'order_rzp_1',
      keyId: 'rzp_test_abc',
      receiptNumber: 'RCPT-1',
      failureReason: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      paidAt: null,
    });

    expect(order.total.amountMinor).toBe(90000);
    expect(order.total.formatted).toContain('900');
    expect(order.discount.amountMinor).toBe(10000);
    expect(order.checkoutPublicKey).toBe('rzp_test_abc');
    expect(order).not.toHaveProperty('signature');
    expect(order).not.toHaveProperty('secret');
    expect(Object.keys(order).sort()).toEqual(
      [
        'batchId',
        'checkoutPublicKey',
        'couponCode',
        'courseId',
        'createdAt',
        'currency',
        'discount',
        'failureReason',
        'id',
        'lines',
        'organizationId',
        'paidAt',
        'planId',
        'providerOrderId',
        'purpose',
        'receiptNumber',
        'status',
        'subtotal',
        'tax',
        'total',
        'updatedAt',
      ].sort(),
    );
  });

  it('normalizes statuses and catalog entries', () => {
    expect(mapPaymentOrderStatus('CAPTURED')).toBe('paid');
    expect(mapPaymentOrderStatus('PARTIALLY_REFUNDED')).toBe('partially_refunded');

    const catalog = mapCatalog({
      currency: 'INR',
      courses: [
        {
          id: 'c1',
          title: 'Foundations',
          priceMinor: 499900,
          batches: [{ id: 'b1', name: 'Weekend', courseId: 'c1' }],
        },
      ],
      plans: [
        {
          id: 'p1',
          name: 'Pro',
          priceMinor: 99900,
          interval: 'YEARLY',
          features: ['Priority support'],
          isActive: true,
        },
      ],
    });

    expect(catalog.courses[0]?.price.amountMinor).toBe(499900);
    expect(catalog.courses[0]?.batches[0]?.name).toBe('Weekend');
    expect(catalog.plans[0]?.interval).toBe('yearly');
  });

  it('maps invoices, history, subscription, and admin records', () => {
    expect(
      mapInvoice({
        id: 'inv-1',
        organizationId: 'org-1',
        invoiceNumber: 'INV-001',
        status: 'PAID',
        totalMinor: 90000,
        currency: 'INR',
        createdAt: '2026-07-01T00:00:00.000Z',
      }).status,
    ).toBe('paid');

    expect(
      mapPaymentHistoryItem({
        id: 'h1',
        status: 'PAID',
        totalMinor: 1000,
        currency: 'INR',
        createdAt: '2026-07-01T00:00:00.000Z',
      }).total.amountMinor,
    ).toBe(1000);

    expect(
      mapSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planId: 'plan-1',
        planName: 'Basic',
        status: 'ACTIVE',
        priceMinor: 49900,
        currency: 'INR',
        interval: 'MONTHLY',
        canRenew: true,
        canUpgrade: true,
        renewMessage: 'Renew before period end',
        upgradeMessage: 'Upgrade available',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      }).canRenew,
    ).toBe(true);

    expect(
      mapAdminOverview({
        organizationId: 'org-1',
        revenueTotalMinor: 500000,
        revenueMonthMinor: 120000,
        currency: 'INR',
        successfulPayments: 12,
      }).revenueTotal.amountMinor,
    ).toBe(500000);

    expect(
      mapPlan({
        id: 'plan-1',
        organizationId: 'org-1',
        name: 'Pro',
        priceMinor: 99900,
        currency: 'INR',
        interval: 'MONTHLY',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      }).price.amountMinor,
    ).toBe(99900);

    expect(
      mapTransaction({
        id: 'tx-1',
        orderId: 'ord-1',
        organizationId: 'org-1',
        status: 'FAILED',
        totalMinor: 1000,
        currency: 'INR',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      }).canRetry,
    ).toBe(true);

    expect(
      mapRefund({
        id: 'rf-1',
        organizationId: 'org-1',
        orderId: 'ord-1',
        status: 'PROCESSED',
        amountMinor: 500,
        currency: 'INR',
        createdAt: '2026-07-01T00:00:00.000Z',
      }).status,
    ).toBe('processed');

    expect(
      mapCoupon({
        id: 'cp-1',
        organizationId: 'org-1',
        code: 'SAVE10',
        discountType: 'PERCENT',
        discountValue: 10,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      }).discountType,
    ).toBe('percent');
  });
});
