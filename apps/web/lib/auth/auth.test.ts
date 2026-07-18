import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loginMock, refreshMock, logoutMock, meMock, storageState } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  refreshMock: vi.fn(),
  logoutMock: vi.fn(),
  meMock: vi.fn(),
  storageState: {
    accessToken: null as string | null,
    refreshToken: null as string | null,
    userJson: null as string | null,
  },
}));

vi.mock('./auth-storage', () => ({
  authStorage: {
    getAccessToken: () => storageState.accessToken,
    getRefreshToken: () => storageState.refreshToken,
    setTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn?: string }) => {
      storageState.accessToken = tokens.accessToken;
      storageState.refreshToken = tokens.refreshToken;
    },
    clearTokens: () => {
      storageState.accessToken = null;
      storageState.refreshToken = null;
    },
    getCachedUserJson: () => storageState.userJson,
    setCachedUserJson: (json: string) => {
      storageState.userJson = json;
    },
    clearCachedUser: () => {
      storageState.userJson = null;
    },
    clearAll: () => {
      storageState.accessToken = null;
      storageState.refreshToken = null;
      storageState.userJson = null;
    },
    hasSessionHint: () => Boolean(storageState.accessToken ?? storageState.refreshToken),
  },
}));

vi.mock('./auth-api', () => ({
  authApi: {
    baseUrl: () => 'http://localhost:3001/api/v1',
    login: loginMock,
    refresh: refreshMock,
    logout: logoutMock,
    me: meMock,
  },
}));

import { AuthUnauthorizedError } from './auth-errors';
import { authService } from './auth-service';
import { authStorage } from './auth-storage';
import {
  AUTH_ROLES,
  canAccessAdminArea,
  canAccessStudentPortal,
  canAccessTeacherPortal,
  hasAnyRole,
  hasPermission,
  resolvePostLoginPath,
} from './auth-session';
import { ROUTES } from '../constants/routes';

describe('auth-session RBAC helpers', () => {
  it('resolves post-login paths by role', () => {
    expect(resolvePostLoginPath([AUTH_ROLES.student])).toBe('/dashboard');
    expect(resolvePostLoginPath([AUTH_ROLES.teacher])).toBe('/teacher/dashboard');
    expect(resolvePostLoginPath([AUTH_ROLES.admin])).toBe('/teacher/dashboard');
  });

  it('enforces portal access rules', () => {
    expect(canAccessTeacherPortal([AUTH_ROLES.teacher])).toBe(true);
    expect(canAccessTeacherPortal([AUTH_ROLES.student])).toBe(false);
    expect(canAccessStudentPortal([AUTH_ROLES.student])).toBe(true);
    expect(canAccessStudentPortal([AUTH_ROLES.teacher])).toBe(false);
    expect(canAccessAdminArea([AUTH_ROLES.admin])).toBe(true);
    expect(canAccessAdminArea([AUTH_ROLES.teacher])).toBe(false);
  });

  it('checks roles and permissions', () => {
    expect(hasAnyRole([AUTH_ROLES.admin], [AUTH_ROLES.teacher, AUTH_ROLES.admin])).toBe(true);
    expect(hasPermission(['course.create'], 'course.create')).toBe(true);
    expect(hasPermission(['course.create'], 'course.update')).toBe(false);
  });
});

describe('authService refresh single-flight', () => {
  beforeEach(() => {
    authService._resetRefreshLockForTests();
    authStorage.clearAll();
    vi.clearAllMocks();
  });

  afterEach(() => {
    authService._resetRefreshLockForTests();
    authStorage.clearAll();
  });

  it('only executes one refresh request for concurrent callers', async () => {
    authStorage.setTokens({
      accessToken: 'access-old',
      refreshToken: 'refresh-1',
      expiresIn: '15m',
    });

    let resolveRefresh!: (value: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    }) => void;

    refreshMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const first = authService.refresh();
    const second = authService.refresh();

    expect(refreshMock).toHaveBeenCalledTimes(1);

    resolveRefresh({
      accessToken: 'access-new',
      refreshToken: 'refresh-2',
      expiresIn: '15m',
    });

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(authStorage.getAccessToken()).toBe('access-new');
  });

  it('clears session when refresh fails', async () => {
    authStorage.setTokens({
      accessToken: 'access-old',
      refreshToken: 'refresh-1',
      expiresIn: '15m',
    });
    refreshMock.mockRejectedValue(new AuthUnauthorizedError());

    await expect(authService.refresh()).resolves.toBe(false);
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });
});

describe('authService login', () => {
  beforeEach(() => {
    authStorage.clearAll();
    vi.clearAllMocks();
  });

  it('stores tokens and loads authorization context', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '15m',
      user: {
        id: 'u1',
        email: 'teacher@graphology.local',
        firstName: 'Sample',
        lastName: 'Teacher',
      },
    });
    meMock.mockResolvedValue({
      id: 'u1',
      email: 'teacher@graphology.local',
      roles: [AUTH_ROLES.teacher],
      permissions: ['course.create'],
      organizationIds: ['org-1'],
    });

    const user = await authService.login({
      email: 'teacher@graphology.local',
      password: 'password',
    });

    expect(user.roles).toContain(AUTH_ROLES.teacher);
    expect(authStorage.getAccessToken()).toBe('access');
    expect(authStorage.getRefreshToken()).toBe('refresh');
  });
});

describe('route protection constants', () => {
  it('wires login route to /login', () => {
    expect(ROUTES.login).toBe('/login');
  });
});
