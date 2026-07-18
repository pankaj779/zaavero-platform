import { DASHBOARD_ROUTES, TEACHER_ROUTES } from '../constants/routes';
import type { AuthRole, AuthSessionUser } from './auth-types';

export const AUTH_ROLES = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
} as const satisfies Record<string, AuthRole>;

export function hasRole(roles: readonly string[], role: AuthRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: readonly string[], required: readonly AuthRole[]): boolean {
  if (required.length === 0) {
    return true;
  }

  return required.some((role) => roles.includes(role));
}

export function hasPermission(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function hasAllPermissions(
  permissions: readonly string[],
  required: readonly string[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  const set = new Set(permissions);
  return required.every((permission) => set.has(permission));
}

/**
 * Role-based home path after login.
 * Admin → teacher portal (full access). Teacher → teacher. Student → student dashboard.
 */
export function resolvePostLoginPath(roles: readonly string[]): string {
  if (hasRole(roles, AUTH_ROLES.admin) || hasRole(roles, AUTH_ROLES.teacher)) {
    return TEACHER_ROUTES.dashboard;
  }

  return DASHBOARD_ROUTES.root;
}

export function canAccessTeacherPortal(roles: readonly string[]): boolean {
  return hasAnyRole(roles, [AUTH_ROLES.admin, AUTH_ROLES.teacher]);
}

export function canAccessStudentPortal(roles: readonly string[]): boolean {
  return hasAnyRole(roles, [AUTH_ROLES.admin, AUTH_ROLES.student]);
}

export function canAccessAdminArea(roles: readonly string[]): boolean {
  return hasRole(roles, AUTH_ROLES.admin);
}

export function parseCachedUser(json: string | null): AuthSessionUser | null {
  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json) as Partial<AuthSessionUser>;
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.email !== 'string' ||
      !Array.isArray(parsed.roles)
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
      lastName: typeof parsed.lastName === 'string' ? parsed.lastName : '',
      roles: parsed.roles.filter((role): role is AuthRole => typeof role === 'string'),
      permissions: Array.isArray(parsed.permissions)
        ? parsed.permissions.filter((value): value is string => typeof value === 'string')
        : [],
      organizationIds: Array.isArray(parsed.organizationIds)
        ? parsed.organizationIds.filter((value): value is string => typeof value === 'string')
        : [],
      profileImage: typeof parsed.profileImage === 'string' ? parsed.profileImage : null,
    };
  } catch {
    return null;
  }
}
