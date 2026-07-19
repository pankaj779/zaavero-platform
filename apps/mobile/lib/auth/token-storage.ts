import * as SecureStore from 'expo-secure-store';
import type { AuthSessionUser, StoredTokens } from '../api/types';

const ACCESS_KEY = 'graphology_access_token';
const REFRESH_KEY = 'graphology_refresh_token';
const USER_KEY = 'graphology_auth_user';
const BIOMETRIC_KEY = 'graphology_biometric_enabled';

/**
 * SecureStore-backed token storage. The mobile app NEVER uses localStorage or
 * AsyncStorage for secrets — tokens live only in the platform keystore/keychain.
 *
 * SecureStore is async, so an in-memory cache mirrors the last known values to
 * keep the synchronous read path (used by the fetch client) fast and safe.
 */
let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;

export const tokenStorage = {
  async hydrate(): Promise<void> {
    accessTokenCache = await SecureStore.getItemAsync(ACCESS_KEY);
    refreshTokenCache = await SecureStore.getItemAsync(REFRESH_KEY);
  },

  getAccessToken(): string | null {
    return accessTokenCache;
  },

  getRefreshToken(): string | null {
    return refreshTokenCache;
  },

  async setTokens(tokens: StoredTokens): Promise<void> {
    accessTokenCache = tokens.accessToken;
    refreshTokenCache = tokens.refreshToken;
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  },

  async clearTokens(): Promise<void> {
    accessTokenCache = null;
    refreshTokenCache = null;
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },

  async getCachedUser(): Promise<AuthSessionUser | null> {
    const json = await SecureStore.getItemAsync(USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as AuthSessionUser;
    } catch {
      return null;
    }
  },

  async setCachedUser(user: AuthSessionUser): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async clearCachedUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await this.clearTokens();
    await this.clearCachedUser();
  },

  async isBiometricEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === 'true';
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? 'true' : 'false');
  },

  hasSessionHint(): boolean {
    return Boolean(accessTokenCache ?? refreshTokenCache);
  },
};
