import { describe, expect, it } from 'vitest';
import { assertMinorUnits, formatMoneyMinorUnits } from './money';

describe('payment money helpers', () => {
  it('formats integer minor units as currency', () => {
    expect(formatMoneyMinorUnits(90000, 'INR')).toMatch(/900/);
    expect(formatMoneyMinorUnits(0, 'INR')).toMatch(/0/);
  });

  it('rejects non-integer amounts', () => {
    expect(() => formatMoneyMinorUnits(10.5, 'INR')).toThrow(/integer minor units/i);
    expect(() => assertMinorUnits(1.2)).toThrow(/integer/i);
    expect(assertMinorUnits(100)).toBe(100);
  });
});
