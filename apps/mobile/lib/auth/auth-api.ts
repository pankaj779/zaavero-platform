import { env } from '../config/env';
import {
  ApiError,
  ForbiddenError,
  NetworkError,
  TokenExpiredError,
  UnauthorizedError,
} from '../api/errors';
import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  AuthMeResponseData,
  LoginCredentials,
  LoginResponseData,
  RefreshResponseData,
  RegisterInput,
} from '../api/types';

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

function readMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as ApiErrorEnvelope).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

function readCode(payload: unknown): string | undefined {
  if (typeof payload === 'object' && payload !== null && 'errorCode' in payload) {
    const code = (payload as ApiErrorEnvelope).errorCode;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function throwForStatus(response: Response, payload: unknown): never {
  const message = readMessage(payload, response.statusText || 'Request failed.');
  const code = readCode(payload);
  if (response.status === 401) {
    if (code === 'TOKEN_EXPIRED') throw new TokenExpiredError(message);
    throw new UnauthorizedError(message, code ?? 'UNAUTHENTICATED');
  }
  if (response.status === 403) throw new ForbiddenError(message);
  throw new ApiError(message, code ?? 'AUTH_REQUEST_FAILED', response.status);
}

async function postJson<T>(path: string, body: unknown, expectData: boolean): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }
  const payload = await parseJson(response);
  if (!response.ok) throwForStatus(response, payload);
  if (!expectData) return undefined as T;
  if (!isSuccessEnvelope<T>(payload)) {
    throw new ApiError('Unexpected API response shape.', 'INVALID_RESPONSE');
  }
  return payload.data;
}

/** Low-level auth calls with no token attach / refresh logic (mirrors web authApi). */
export const authApi = {
  login(credentials: LoginCredentials): Promise<LoginResponseData> {
    return postJson<LoginResponseData>('/auth/login', credentials, true);
  },

  register(input: RegisterInput): Promise<unknown> {
    return postJson<unknown>('/auth/register', input, true);
  },

  refresh(refreshToken: string): Promise<RefreshResponseData> {
    return postJson<RefreshResponseData>('/auth/refresh', { refreshToken }, true);
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${env.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Logout still clears the local session even if the network call fails.
    }
  },

  forgotPassword(email: string): Promise<void> {
    return postJson<void>('/auth/forgot-password', { email }, false);
  },

  resetPassword(token: string, password: string): Promise<void> {
    return postJson<void>('/auth/reset-password', { token, password }, false);
  },

  resendVerification(email: string): Promise<void> {
    return postJson<void>('/auth/resend-verification', { email }, false);
  },

  async verifyEmail(token: string): Promise<{ email: string }> {
    let response: Response;
    try {
      response = await fetch(
        `${env.apiBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`,
        { method: 'GET', headers: { Accept: 'application/json' } },
      );
    } catch {
      throw new NetworkError();
    }
    const payload = await parseJson(response);
    if (!response.ok) throwForStatus(response, payload);
    if (!isSuccessEnvelope<{ email: string }>(payload)) {
      throw new ApiError('Unexpected API response shape.', 'INVALID_RESPONSE');
    }
    return payload.data;
  },

  async me(accessToken: string): Promise<AuthMeResponseData> {
    let response: Response;
    try {
      response = await fetch(`${env.apiBaseUrl}/auth/me`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      throw new NetworkError();
    }
    const payload = await parseJson(response);
    if (!response.ok) throwForStatus(response, payload);
    if (!isSuccessEnvelope<AuthMeResponseData>(payload)) {
      throw new ApiError('Unexpected API response shape.', 'INVALID_RESPONSE');
    }
    return payload.data;
  },
};
