import { describe, expect, it } from 'vitest';
import type { UserRole } from '@graphology/types';

/**
 * Mirrors the portal routing priority used by app/index.tsx.
 * Keeping this pure makes the navigation contract unit-testable without
 * mounting Expo Router.
 */
function resolvePortal(roles: UserRole[]): 'admin' | 'teacher' | 'student' | 'none' {
  if (roles.includes('Admin')) return 'admin';
  if (roles.includes('Teacher')) return 'teacher';
  if (roles.includes('Student')) return 'student';
  return 'none';
}

describe('role-based navigation', () => {
  it('routes Admin ahead of other roles', () => {
    expect(resolvePortal(['Student', 'Admin', 'Teacher'])).toBe('admin');
  });

  it('routes Teacher ahead of Student', () => {
    expect(resolvePortal(['Student', 'Teacher'])).toBe('teacher');
  });

  it('routes Student when no higher role is present', () => {
    expect(resolvePortal(['Student'])).toBe('student');
  });

  it('returns none when no portal role is present', () => {
    expect(resolvePortal(['Parent'])).toBe('none');
  });
});
