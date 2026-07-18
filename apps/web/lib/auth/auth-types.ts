/**
 * Frontend authentication types for NestJS auth integration.
 */

export type AuthRole = 'Admin' | 'Teacher' | 'Student' | 'Parent';

export interface AuthUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthSessionUser extends AuthUserSummary {
  roles: AuthRole[];
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
  roles: AuthRole[];
  permissions: string[];
  organizationIds: string[];
}

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthContextValue {
  user: AuthSessionUser | null;
  organizationIds: string[];
  roles: AuthRole[];
  permissions: string[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}
