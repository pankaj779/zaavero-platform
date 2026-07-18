/**
 * Minor-unit money helpers for display only.
 * Authoritative totals always come from the backend — never recalculate checkout amounts here.
 */

export function formatMoneyMinorUnits(
  amountMinor: number,
  currency: string,
  locale = 'en-IN',
): string {
  if (!Number.isInteger(amountMinor)) {
    throw new Error('Money amounts must be integer minor units.');
  }

  const normalizedCurrency = currency.trim().toUpperCase() || 'INR';
  const major = amountMinor / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${normalizedCurrency} ${major.toFixed(2)}`;
  }
}

export function assertMinorUnits(amountMinor: number, fieldName = 'amountMinor'): number {
  if (!Number.isInteger(amountMinor)) {
    throw new Error(`${fieldName} must be an integer minor-unit value.`);
  }
  return amountMinor;
}
