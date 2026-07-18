import { describe, expect, it } from 'vitest';
import type { AuthSessionUser } from '../../../lib/auth';
import {
  formatAccountStatus,
  formatEmailVerified,
  formatOptionalField,
  formatProgressPercent,
  getStudentDisplayName,
} from './profile-display';

describe('student profile display helpers', () => {
  it('renders auth identity without inventing missing values', () => {
    expect(getStudentDisplayName({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada Lovelace');
    expect(getStudentDisplayName({ firstName: '', lastName: '' })).toBe('—');
    expect(formatOptionalField(null)).toBe('—');
    expect(formatOptionalField('')).toBe('—');
    expect(formatOptionalField('+91 99999')).toBe('+91 99999');
    expect(formatProgressPercent(null)).toBe('—');
    expect(formatProgressPercent(72)).toBe('72%');
  });

  it('only shows account status and verification when auth provides them', () => {
    const base: AuthSessionUser = {
      id: 'u1',
      email: 'student@example.com',
      firstName: 'Sam',
      lastName: 'Student',
      roles: ['Student'],
      permissions: [],
      organizationIds: ['org-1'],
    };

    expect(formatAccountStatus(base)).toBe('—');
    expect(formatEmailVerified(base)).toBe('—');
    expect(formatAccountStatus({ ...base, isActive: true })).toBe('Active');
    expect(formatAccountStatus({ ...base, isActive: false })).toBe('Inactive');
    expect(formatEmailVerified({ ...base, emailVerified: true })).toBe('Verified');
    expect(formatEmailVerified({ ...base, emailVerified: false })).toBe('Not verified');
    expect(formatOptionalField(base.phone)).toBe('—');
    expect(formatOptionalField({ ...base, phone: '555-0100' }.phone)).toBe('555-0100');
  });
});
