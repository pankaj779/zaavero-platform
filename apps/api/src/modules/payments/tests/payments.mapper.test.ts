import { describe, expect, it } from 'vitest';
import { PaymentsMapper, planFeatureList } from '../mappers/payments.mapper';
import {
  createCouponRecord,
  createOrderRecord,
  createPlanRecord,
  createSubscriptionRecord,
} from './payments-test.helpers';

describe('PaymentsMapper', () => {
  it('maps orders with lines, snapshots, and ISO dates', () => {
    const dto = PaymentsMapper.toOrderResponse(
      createOrderRecord({
        discountMinor: 5_000,
        totalMinor: 45_000,
        couponCode: 'WELCOME10',
        paidAt: new Date('2026-07-01T01:00:00.000Z'),
      }),
      'rzp_test_key',
    );

    expect(dto.checkoutPublicKey).toBe('rzp_test_key');
    expect(dto.lines).toEqual([
      {
        label: 'Graphology Basics — Batch A',
        amountMinor: 50_000,
        currency: 'INR',
      },
      { label: 'Discount (WELCOME10)', amountMinor: -5_000, currency: 'INR' },
    ]);
    expect(dto.paidAt).toBe('2026-07-01T01:00:00.000Z');
    expect(dto.totalMinor).toBe(45_000);
  });

  it('maps percentage coupons back to percent points', () => {
    const dto = PaymentsMapper.toCouponResponse(createCouponRecord({ percentOffBps: 1_550 }));
    expect(dto.discountType).toBe('percent');
    expect(dto.discountValue).toBe(16); // rounded from 15.5
  });

  it('maps fixed coupons to minor units', () => {
    const dto = PaymentsMapper.toCouponResponse(
      createCouponRecord({
        type: 'FIXED_AMOUNT',
        percentOffBps: null,
        amountOffMinor: 20_000,
        currency: 'INR',
      }),
    );
    expect(dto.discountType).toBe('fixed');
    expect(dto.discountValue).toBe(20_000);
    expect(dto.currency).toBe('INR');
  });

  it('exposes plan price under priceMinor', () => {
    const dto = PaymentsMapper.toPlanResponse(createPlanRecord());
    expect(dto.priceMinor).toBe(99_900);
    expect(dto.features).toEqual(['Feature one']);
  });

  it('computes renewal/upgrade hints for subscriptions', () => {
    const active = PaymentsMapper.toSubscriptionResponse(createSubscriptionRecord());
    expect(active.canRenew).toBe(true);
    expect(active.canUpgrade).toBe(true);

    const enterprise = PaymentsMapper.toSubscriptionResponse(
      createSubscriptionRecord({ planTierSnapshot: 'ENTERPRISE' }),
    );
    expect(enterprise.canUpgrade).toBe(false);

    const cancelled = PaymentsMapper.toSubscriptionResponse(
      createSubscriptionRecord({ status: 'CANCELLED' }),
    );
    expect(cancelled.canRenew).toBe(false);
    expect(cancelled.renewMessage).toBeTruthy();
  });
});

describe('planFeatureList', () => {
  it('passes string arrays through', () => {
    expect(planFeatureList(['A', ' B ', ''])).toEqual(['A', 'B']);
  });

  it('converts feature objects to readable strings', () => {
    expect(planFeatureList({ maxStudents: 250, prioritySupport: true, sso: false })).toEqual([
      'Max Students: 250',
      'Priority Support',
    ]);
  });

  it('returns an empty list for null or scalar values', () => {
    expect(planFeatureList(null)).toEqual([]);
    expect(planFeatureList('unexpected')).toEqual([]);
  });
});
