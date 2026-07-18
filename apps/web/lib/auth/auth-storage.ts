import { AUTH_COOKIE_NAMES } from '@graphology/auth';

const ACCESS_KEY = AUTH_COOKIE_NAMES.accessToken;
const REFRESH_KEY = AUTH_COOKIE_NAMES.refreshToken;
const USER_KEY = 'graphology_auth_user';

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readCookie(name: string): string | null {
  if (!canUseDom()) {
    return null;
  }

  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(name.length + 1));
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!canUseDom()) {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${String(maxAgeSeconds)}; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  if (!canUseDom()) {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readLocal(name: string): string | null {
  if (!canUseDom()) {
    return null;
  }

  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeLocal(name: string, value: string): void {
  if (!canUseDom()) {
    return;
  }

  try {
    window.localStorage.setItem(name, value);
  } catch {
    // Ignore quota / private mode failures; cookies remain the middleware source of truth.
  }
}

function clearLocal(name: string): void {
  if (!canUseDom()) {
    return;
  }

  try {
    window.localStorage.removeItem(name);
  } catch {
    // no-op
  }
}

/** Access token TTL fallback when expiresIn cannot be parsed (15 minutes). */
const DEFAULT_ACCESS_MAX_AGE = 60 * 15;
/** Refresh token cookie lifetime (30 days). */
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

function parseExpiresInToSeconds(expiresIn: string | undefined): number {
  if (!expiresIn) {
    return DEFAULT_ACCESS_MAX_AGE;
  }

  const match = /^(\d+)([smhd])$/i.exec(expiresIn.trim());
  if (!match) {
    return DEFAULT_ACCESS_MAX_AGE;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return DEFAULT_ACCESS_MAX_AGE;
  }
}

/**
 * Secure storage abstraction for auth tokens and cached session user.
 * Components must never touch localStorage/cookies directly.
 */
export const authStorage = {
  getAccessToken(): string | null {
    return readCookie(ACCESS_KEY) ?? readLocal(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return readCookie(REFRESH_KEY) ?? readLocal(REFRESH_KEY);
  },

  setTokens(tokens: { accessToken: string; refreshToken: string; expiresIn?: string }): void {
    const accessMaxAge = parseExpiresInToSeconds(tokens.expiresIn);
    writeCookie(ACCESS_KEY, tokens.accessToken, accessMaxAge);
    writeCookie(REFRESH_KEY, tokens.refreshToken, REFRESH_MAX_AGE);
    writeLocal(ACCESS_KEY, tokens.accessToken);
    writeLocal(REFRESH_KEY, tokens.refreshToken);
  },

  clearTokens(): void {
    clearCookie(ACCESS_KEY);
    clearCookie(REFRESH_KEY);
    clearLocal(ACCESS_KEY);
    clearLocal(REFRESH_KEY);
  },

  getCachedUserJson(): string | null {
    return readLocal(USER_KEY);
  },

  setCachedUserJson(json: string): void {
    writeLocal(USER_KEY, json);
  },

  clearCachedUser(): void {
    clearLocal(USER_KEY);
  },

  clearAll(): void {
    this.clearTokens();
    this.clearCachedUser();
  },

  hasSessionHint(): boolean {
    return Boolean(this.getAccessToken() ?? this.getRefreshToken());
  },
};
