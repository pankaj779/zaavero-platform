export type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  AuthContextValue,
  AuthMeResponseData,
  AuthRole,
  AuthSessionUser,
  AuthTokens,
  AuthUserSummary,
  LoginCredentials,
  LoginResponseData,
  RefreshResponseData,
} from './auth-types';

export {
  AuthError,
  AuthForbiddenError,
  AuthNetworkError,
  AuthTokenExpiredError,
  AuthUnauthorizedError,
  toAuthError,
} from './auth-errors';

export { authStorage } from './auth-storage';
export { authApi } from './auth-api';
export { authService } from './auth-service';
export { apiFetch } from './api-client';
export {
  AUTH_ROLES,
  canAccessAdminArea,
  canAccessStudentPortal,
  canAccessTeacherPortal,
  hasAllPermissions,
  hasAnyRole,
  hasPermission,
  hasRole,
  parseCachedUser,
  resolvePostLoginPath,
} from './auth-session';
export { AuthProvider, useAuthContext } from './auth-provider';
export {
  useAuth,
  useOrganization,
  usePermissions,
  useRequireAuth,
  useRequireRole,
} from './auth-hooks';
export {
  RequireAdminArea,
  RequireAuth,
  RequireOrganization,
  RequirePermission,
  RequireRole,
  RequireStudentPortal,
  RequireTeacherPortal,
} from './auth-guards';
export { POST_LOGIN_REDIRECT } from './redirect';
