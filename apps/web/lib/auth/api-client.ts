import { authApi } from './auth-api';
import {
  AuthForbiddenError,
  AuthNetworkError,
  AuthTokenExpiredError,
  AuthUnauthorizedError,
} from './auth-errors';
import { authService } from './auth-service';
import { authStorage } from './auth-storage';
import type { ApiSuccessEnvelope } from './auth-types';

export type AuthenticatedFetchInit = RequestInit & {
  /** Skip Authorization header (public endpoints). */
  skipAuth?: boolean;
};

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSuccessEnvelope<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success?: unknown }).success === true
  );
}

function readMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = Reflect.get(payload, 'message');
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

/**
 * Central authenticated HTTP client for NestJS APIs.
 * Attaches bearer token, refreshes once on 401, logs out when refresh fails.
 */
export async function apiFetch<T>(path: string, init: AuthenticatedFetchInit = {}): Promise<T> {
  const base = authApi.baseUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const execute = async (accessToken: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!init.skipAuth && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    try {
      return await fetch(url, { ...init, headers });
    } catch {
      throw new AuthNetworkError();
    }
  };

  let response = await execute(init.skipAuth ? null : authStorage.getAccessToken());

  if (response.status === 401 && !init.skipAuth) {
    const refreshed = await authService.refresh();
    if (!refreshed) {
      await authService.logout();
      throw new AuthUnauthorizedError();
    }
    response = await execute(authStorage.getAccessToken());
  }

  const payload = await parseJson(response);

  if (response.status === 401) {
    throw new AuthUnauthorizedError(readMessage(payload, 'Authentication required.'));
  }

  if (response.status === 403) {
    throw new AuthForbiddenError(
      readMessage(payload, 'You do not have permission to perform this action.'),
    );
  }

  if (!response.ok) {
    throw new AuthUnauthorizedError(
      readMessage(payload, `Request failed with status ${String(response.status)}.`),
      'API_REQUEST_FAILED',
    );
  }

  if (isSuccessEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

export async function apiFetchOrThrowExpired<T>(
  path: string,
  init?: AuthenticatedFetchInit,
): Promise<T> {
  try {
    return await apiFetch<T>(path, init);
  } catch (error: unknown) {
    if (error instanceof AuthTokenExpiredError) {
      throw error;
    }
    throw error;
  }
}
