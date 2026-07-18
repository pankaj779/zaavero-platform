export class AuthError extends Error {
  readonly code: string;
  readonly statusCode?: number;

  constructor(message: string, code = 'AUTH_ERROR', statusCode?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthNetworkError extends AuthError {
  constructor(message = 'Network request failed.') {
    super(message, 'AUTH_NETWORK_ERROR');
    this.name = 'AuthNetworkError';
  }
}

export class AuthUnauthorizedError extends AuthError {
  constructor(message = 'Authentication required.', code = 'UNAUTHENTICATED') {
    super(message, code, 401);
    this.name = 'AuthUnauthorizedError';
  }
}

export class AuthForbiddenError extends AuthError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthForbiddenError';
  }
}

export class AuthTokenExpiredError extends AuthError {
  constructor(message = 'Access token has expired.') {
    super(message, 'TOKEN_EXPIRED', 401);
    this.name = 'AuthTokenExpiredError';
  }
}

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof Error) {
    return new AuthError(error.message);
  }

  return new AuthError('Unexpected authentication error.');
}
