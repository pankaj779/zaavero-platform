import { authApi } from './auth-api';
import {
  AuthError,
  AuthTokenExpiredError,
  AuthUnauthorizedError,
  toAuthError,
} from './auth-errors';
import { parseCachedUser } from './auth-session';
import { authStorage } from './auth-storage';
import type { AuthMeResponseData, AuthSessionUser, LoginCredentials } from './auth-types';

let refreshInFlight: Promise<boolean> | null = null;

function mergeSessionUser(
  profile: { id: string; email: string; firstName?: string; lastName?: string },
  me: AuthMeResponseData,
): AuthSessionUser {
  return {
    id: me.id,
    email: me.email,
    firstName: me.firstName ?? profile.firstName ?? '',
    lastName: me.lastName ?? profile.lastName ?? '',
    roles: me.roles,
    permissions: me.permissions,
    organizationIds: me.organizationIds,
    phone: me.phone ?? null,
    emailVerified: me.emailVerified ?? false,
    isActive: me.isActive ?? true,
  };
}

function persistUser(user: AuthSessionUser): void {
  authStorage.setCachedUserJson(JSON.stringify(user));
}

/**
 * Auth service — single place for login/logout/refresh/session bootstrap.
 * Refresh is single-flight to prevent storms.
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSessionUser> {
    const data = await authApi.login(credentials);
    authStorage.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });

    const me = await authApi.me(data.accessToken);
    const user = mergeSessionUser(data.user, me);
    persistUser(user);
    return user;
  },

  async logout(): Promise<void> {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    authStorage.clearAll();
  },

  /**
   * Rotates tokens. Only one refresh runs at a time.
   * @returns true when refresh succeeded
   */
  async refresh(): Promise<boolean> {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight = (async (): Promise<boolean> => {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        authStorage.clearAll();
        return false;
      }

      try {
        const data = await authApi.refresh(refreshToken);
        authStorage.setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        });
        return true;
      } catch (error: unknown) {
        authStorage.clearAll();
        if (
          error instanceof AuthUnauthorizedError ||
          error instanceof AuthTokenExpiredError ||
          error instanceof AuthError
        ) {
          return false;
        }
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  async loadSession(): Promise<AuthSessionUser | null> {
    const cached = parseCachedUser(authStorage.getCachedUserJson());
    let accessToken = authStorage.getAccessToken();

    if (!accessToken) {
      const refreshed = await this.refresh();
      if (!refreshed) {
        return null;
      }
      accessToken = authStorage.getAccessToken();
    }

    if (!accessToken) {
      return null;
    }

    try {
      const me = await authApi.me(accessToken);
      const user = mergeSessionUser(
        {
          id: me.id,
          email: me.email,
          firstName: cached?.firstName,
          lastName: cached?.lastName,
        },
        me,
      );
      persistUser(user);
      return user;
    } catch (error: unknown) {
      if (error instanceof AuthTokenExpiredError || error instanceof AuthUnauthorizedError) {
        const refreshed = await this.refresh();
        if (!refreshed) {
          return null;
        }

        const nextAccess = authStorage.getAccessToken();
        if (!nextAccess) {
          return null;
        }

        const me = await authApi.me(nextAccess);
        const user = mergeSessionUser(
          {
            id: me.id,
            email: me.email,
            firstName: cached?.firstName,
            lastName: cached?.lastName,
          },
          me,
        );
        persistUser(user);
        return user;
      }

      throw toAuthError(error);
    }
  },

  getAccessToken(): string | null {
    return authStorage.getAccessToken();
  },

  /** Test helper — reset single-flight lock. */
  _resetRefreshLockForTests(): void {
    refreshInFlight = null;
  },
};
