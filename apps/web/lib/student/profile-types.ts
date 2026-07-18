import type { AuthRole, AuthSessionUser } from '../auth/auth-types';
import type { StudentCertificateDto } from '../teacher/certificate-types';
import type { StudentIntegrationAvailability } from './course-types';
import type { StudentProgressOverviewDto } from './progress-types';

/**
 * Student profile — composed from authenticated AuthSessionUser supplied by the caller.
 * No fake backend profile fields.
 */

export interface StudentProfilePreferencesDto {
  theme: 'system' | 'light' | 'dark';
  language: string | null;
  timezone: string | null;
}

export interface StudentProfileCapabilitiesDto {
  avatarUpload: StudentIntegrationAvailability;
  profileEditing: StudentIntegrationAvailability;
  preferenceSync: StudentIntegrationAvailability;
  passwordChange: StudentIntegrationAvailability;
  twoFactor: StudentIntegrationAvailability;
}

export interface StudentProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: AuthRole[];
  organizationIds: string[];
  avatarUrl: string | null;
  /** Derived from fetched progress/certificates when provided; otherwise null fields. */
  learning: StudentProgressOverviewDto | null;
  certificates: StudentCertificateDto[];
  preferences: StudentProfilePreferencesDto;
  capabilities: StudentProfileCapabilitiesDto;
}

/** Input for profile composition — caller supplies the authenticated session user. */
export type StudentProfileAuthInput = AuthSessionUser;
