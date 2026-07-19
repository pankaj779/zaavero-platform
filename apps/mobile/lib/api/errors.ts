export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code = 'API_ERROR', status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network request failed. Check your connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required.', code = 'UNAUTHENTICATED') {
    super(message, code, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor(message = 'Your session has expired.') {
    super(message, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}
