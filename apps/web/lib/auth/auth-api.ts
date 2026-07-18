import {
  AuthForbiddenError,
  AuthNetworkError,
  AuthTokenExpiredError,
  AuthUnauthorizedError,
} from './auth-errors';
import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  AuthMeResponseData,
  LoginCredentials,
  LoginResponseData,
  RefreshResponseData,
} from './auth-types';

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return 'http://localhost:3001/api/v1';
}

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
    (value as { success?: unknown }).success === true &&
    'data' in value
  );
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as ApiErrorEnvelope).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallback;
}

function readErrorCode(payload: unknown): string | undefined {
  if (typeof payload === 'object' && payload !== null && 'errorCode' in payload) {
    const code = (payload as ApiErrorEnvelope).errorCode;
    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
}

function throwForStatus(response: Response, payload: unknown): never {
  const message = readErrorMessage(payload, response.statusText || 'Request failed.');
  const code = readErrorCode(payload);

  if (response.status === 401) {
    if (code === 'TOKEN_EXPIRED') {
      throw new AuthTokenExpiredError(message);
    }
    throw new AuthUnauthorizedError(message, code ?? 'UNAUTHENTICATED');
  }

  if (response.status === 403) {
    throw new AuthForbiddenError(message);
  }

  throw new AuthUnauthorizedError(message, code ?? 'AUTH_REQUEST_FAILED');
}

/**
 * Low-level NestJS auth API calls (no token attach / refresh logic).
 */
export const authApi = {
  baseUrl: getApiBaseUrl,

  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(credentials),
      });
    } catch {
      throw new AuthNetworkError();
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      throwForStatus(response, payload);
    }

    if (!isSuccessEnvelope<LoginResponseData>(payload)) {
      throw new AuthUnauthorizedError('Login response was invalid.');
    }

    return payload.data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponseData> {
    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      throw new AuthNetworkError();
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      throwForStatus(response, payload);
    }

    if (!isSuccessEnvelope<RefreshResponseData>(payload)) {
      throw new AuthUnauthorizedError('Refresh response was invalid.');
    }

    return payload.data;
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Logout should still clear local session even if the network call fails.
    }
  },

  async me(accessToken: string): Promise<AuthMeResponseData> {
    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}/auth/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      throw new AuthNetworkError();
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      throwForStatus(response, payload);
    }

    if (!isSuccessEnvelope<AuthMeResponseData>(payload)) {
      throw new AuthUnauthorizedError('Current user response was invalid.');
    }

    return payload.data;
  },
};
