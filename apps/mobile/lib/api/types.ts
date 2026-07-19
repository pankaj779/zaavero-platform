import type { UserRole } from '@graphology/types';

/** Standard NestJS success envelope (mirrors apps/web auth-types). */
export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errorCode?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthSessionUser extends AuthUserSummary {
  roles: UserRole[];
  permissions: string[];
  organizationIds: string[];
  phone?: string | null;
  profileImage?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUserSummary;
}

export interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthMeResponseData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  profileImage: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
  roles: UserRole[];
  permissions: string[];
  organizationIds: string[];
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export type { UserRole };
