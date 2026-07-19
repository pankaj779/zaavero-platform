import { env } from '../config/env';
import { authService } from '../auth/auth-service';
import { tokenStorage } from '../auth/token-storage';
import { getSecureFetch } from '../security/certificate-pinning';
import {
  ApiError,
  ForbiddenError,
  NetworkError,
  UnauthorizedError,
} from './errors';
import type { ApiSuccessEnvelope } from './types';

export type ApiFetchInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
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
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

function serializeBody(body: ApiFetchInit['body']): BodyInit | null | undefined {
  if (body == null) return body as null | undefined;
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof ArrayBuffer ||
    body instanceof Blob
  ) {
    return body as BodyInit;
  }
  return JSON.stringify(body);
}

/**
 * Central authenticated HTTP client for the existing NestJS APIs.
 * Mirrors apps/web apiFetch: attaches bearer token, refreshes once on 401,
 * unwraps the success envelope, and normalizes errors.
 *
 * The mobile app calls the SAME endpoints as web — no forked backend logic.
 */
export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const rawBody = serializeBody(init.body);

  const execute = async (accessToken: string | null): Promise<Response> => {
    const headers = new Headers(init.headers as HeadersInit | undefined);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (rawBody && !(rawBody instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!init.skipAuth && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    try {
      return await getSecureFetch()(url, { ...init, headers, body: rawBody });
    } catch {
      throw new NetworkError();
    }
  };

  let response = await execute(init.skipAuth ? null : tokenStorage.getAccessToken());

  if (response.status === 401 && !init.skipAuth) {
    const refreshed = await authService.refresh();
    if (!refreshed) {
      await authService.logout();
      throw new UnauthorizedError();
    }
    response = await execute(tokenStorage.getAccessToken());
  }

  const payload = await parseJson(response);

  if (response.status === 401) {
    throw new UnauthorizedError(readMessage(payload, 'Authentication required.'));
  }
  if (response.status === 403) {
    throw new ForbiddenError(
      readMessage(payload, 'You do not have permission to perform this action.'),
    );
  }
  if (!response.ok) {
    throw new ApiError(
      readMessage(payload, `Request failed with status ${String(response.status)}.`),
      'API_REQUEST_FAILED',
      response.status,
    );
  }

  if (isSuccessEnvelope<T>(payload)) {
    return payload.data;
  }
  return payload as T;
}
