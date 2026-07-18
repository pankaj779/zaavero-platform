import type { AuthSessionUser } from '../../../lib/auth';
import type { StudentProfileDto } from '../../../lib/student';
import { studentProfileCopy } from './copy';

export function getStudentDisplayName(
  profile: Pick<StudentProfileDto, 'firstName' | 'lastName'>,
): string {
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  return name.length > 0 ? name : studentProfileCopy.missingValue;
}

export function formatOptionalField(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return studentProfileCopy.missingValue;
  }
  return value;
}

export function formatAccountStatus(user: AuthSessionUser | null): string {
  if (user?.isActive === undefined) {
    return studentProfileCopy.missingValue;
  }
  return user.isActive ? studentProfileCopy.activeStatus : studentProfileCopy.inactiveStatus;
}

export function formatEmailVerified(user: AuthSessionUser | null): string {
  if (user?.emailVerified === undefined) {
    return studentProfileCopy.missingValue;
  }
  return user.emailVerified ? studentProfileCopy.verifiedYes : studentProfileCopy.verifiedNo;
}

export function formatProgressPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return studentProfileCopy.missingValue;
  }
  return `${String(value)}%`;
}

export function formatPreferenceValue(value: string | null | undefined): string {
  return formatOptionalField(value);
}
