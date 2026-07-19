import { authApi } from './auth-api';
import { tokenStorage } from './token-storage';
import type {
  AuthMeResponseData,
  AuthSessionUser,
  AuthUserSummary,
  LoginCredentials,
  RegisterInput,
} from '../api/types';

let refreshInFlight: Promise<boolean> | null = null;

function mergeSessionUser(
  profile: Partial<AuthUserSummary>,
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
    profileImage: me.profileImage,
    emailVerified: me.emailVerified ?? false,
    isActive: me.isActive ?? true,
  };
}

/**
 * Auth orchestration — mirrors apps/web auth-service but persists to SecureStore.
 * Refresh is single-flight to prevent token-refresh storms.
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSessionUser> {
    const data = await authApi.login(credentials);
    await tokenStorage.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
    const me = await authApi.me(data.accessToken);
    const user = mergeSessionUser(data.user, me);
    await tokenStorage.setCachedUser(user);
    return user;
  },

  register(input: RegisterInput): Promise<unknown> {
    return authApi.register(input);
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    await tokenStorage.clearAll();
  },

  async refresh(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async (): Promise<boolean> => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        await tokenStorage.clearAll();
        return false;
      }
      try {
        const data = await authApi.refresh(refreshToken);
        await tokenStorage.setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        });
        return true;
      } catch {
        await tokenStorage.clearAll();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  async loadSession(): Promise<AuthSessionUser | null> {
    await tokenStorage.hydrate();
    const cached = await tokenStorage.getCachedUser();
    let accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
      const refreshed = await this.refresh();
      if (!refreshed) return null;
      accessToken = tokenStorage.getAccessToken();
    }
    if (!accessToken) return null;

    try {
      const me = await authApi.me(accessToken);
      const user = mergeSessionUser(cached ?? {}, me);
      await tokenStorage.setCachedUser(user);
      return user;
    } catch {
      const refreshed = await this.refresh();
      if (!refreshed) return null;
      const nextAccess = tokenStorage.getAccessToken();
      if (!nextAccess) return null;
      const me = await authApi.me(nextAccess);
      const user = mergeSessionUser(cached ?? {}, me);
      await tokenStorage.setCachedUser(user);
      return user;
    }
  },

  getAccessToken(): string | null {
    return tokenStorage.getAccessToken();
  },

  /** Test helper — reset single-flight lock. */
  _resetRefreshLockForTests(): void {
    refreshInFlight = null;
  },
};
