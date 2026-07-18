import { randomBytes } from 'node:crypto';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type { BillingIntervalValue } from '../constants/payment.constants';
import {
  IDEMPOTENCY_KEY_MAX_LENGTH,
  IDEMPOTENCY_KEY_MIN_LENGTH,
} from '../constants/payment.constants';
import {
  IdempotencyKeyRequiredException,
  PaymentOrganizationAccessDeniedException,
} from '../exceptions';
import type { ProviderPayment } from '../providers/payment-provider.interface';
import type { SafePaymentMethodData } from '../interfaces/payments-repository.interface';

export function assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
  if (!user.organizationIds.includes(organizationId)) {
    throw new PaymentOrganizationAccessDeniedException();
  }
}

export function resolveOrganizationId(user: AuthenticatedUser, organizationId?: string): string {
  if (organizationId) {
    assertOrganizationAccess(user, organizationId);
    return organizationId;
  }
  if (user.organizationIds.length === 1 && user.organizationIds[0]) {
    return user.organizationIds[0];
  }
  throw new PaymentOrganizationAccessDeniedException(
    'organizationId is required when you belong to multiple organizations.',
  );
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes(AUTH_ROLES.admin);
}

export function requireIdempotencyKey(header: string | undefined): string {
  const key = header?.trim();
  if (!key || key.length < IDEMPOTENCY_KEY_MIN_LENGTH || key.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new IdempotencyKeyRequiredException();
  }
  return key;
}

export function generateReceipt(): string {
  return `rcpt_${randomBytes(12).toString('hex')}`;
}

export function addBillingInterval(start: Date, interval: BillingIntervalValue): Date {
  const end = new Date(start);
  if (interval === 'MONTHLY') {
    end.setMonth(end.getMonth() + 1);
  } else if (interval === 'QUARTERLY') {
    end.setMonth(end.getMonth() + 3);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

export function pageMeta(
  total: number,
  page: number,
  limit: number,
): { total: number; page: number; limit: number; totalPages: number } {
  return {
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

function maskVpa(vpa: string): string {
  const [local, domain] = vpa.split('@');
  const localPart = local ?? '';
  return `${localPart.slice(0, 2)}***@${domain ?? '***'}`;
}

/**
 * Reduces a provider payment to PCI-safe payment-method metadata.
 * Never returns PAN, CVV, or full UPI handles.
 */
export function toSafePaymentMethod(payment: ProviderPayment): SafePaymentMethodData | undefined {
  switch (payment.method) {
    case 'card':
      return {
        type: 'CARD',
        cardLast4: payment.cardLast4 ?? undefined,
        cardNetwork: payment.cardNetwork ?? undefined,
        displayName: payment.cardLast4 ? `Card •••• ${payment.cardLast4}` : 'Card',
      };
    case 'upi':
      return {
        type: 'UPI',
        upiHandleMasked: payment.vpa ? maskVpa(payment.vpa) : undefined,
        displayName: 'UPI',
      };
    case 'netbanking':
      return {
        type: 'NETBANKING',
        bankName: payment.bank ?? undefined,
        displayName: payment.bank ?? 'Netbanking',
      };
    case 'wallet':
      return {
        type: 'WALLET',
        walletName: payment.wallet ?? undefined,
        displayName: payment.wallet ?? 'Wallet',
      };
    case 'emi':
      return { type: 'EMI', displayName: 'EMI' };
    case 'bank_transfer':
      return { type: 'BANK_TRANSFER', displayName: 'Bank transfer' };
    case null:
      return undefined;
    default:
      return { type: 'OTHER', displayName: payment.method };
  }
}
