import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STUDENT_CLIENT_PREFERENCES,
  loadStudentClientPreferences,
  parseStudentClientPreferences,
  saveStudentClientPreferences,
  studentPreferencesStorageKey,
  STUDENT_PREFERENCES_STORAGE_VERSION,
  STUDENT_UNSUPPORTED_ACCOUNT_ACTIONS,
  STUDENT_UNSUPPORTED_INTEGRATION_ACTIONS,
  STUDENT_UNSUPPORTED_SECURITY_ACTIONS,
} from './preferences-storage';

describe('student client preferences storage', () => {
  it('uses a versioned per-user localStorage key', () => {
    expect(studentPreferencesStorageKey('user-42')).toBe(
      `graphology.student.preferences.v${String(STUDENT_PREFERENCES_STORAGE_VERSION)}.user-42`,
    );
  });

  it('persists and reloads supported preferences without inventing values', () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
    };

    const next = {
      ...DEFAULT_STUDENT_CLIENT_PREFERENCES,
      theme: 'dark' as const,
      language: 'en',
      timezone: 'Asia/Kolkata',
      inAppNotifications: false,
      privacy: {
        showFullNameInDiscussions: false,
        allowMentorDirectMessages: true,
        shareProgressWithOrganization: false,
      },
    };

    saveStudentClientPreferences('user-1', next, storage);
    expect(loadStudentClientPreferences('user-1', storage)).toEqual(next);
  });

  it('rejects invalid or mismatched versions', () => {
    expect(parseStudentClientPreferences(null)).toBeNull();
    expect(parseStudentClientPreferences('{')).toBeNull();
    expect(
      parseStudentClientPreferences(
        JSON.stringify({ ...DEFAULT_STUDENT_CLIENT_PREFERENCES, version: 999 }),
      ),
    ).toBeNull();
    expect(
      loadStudentClientPreferences('missing', {
        getItem: () => null,
      }),
    ).toEqual(DEFAULT_STUDENT_CLIENT_PREFERENCES);
  });

  it('keeps unsupported security, integration, and account actions listed as disabled', () => {
    expect(STUDENT_UNSUPPORTED_SECURITY_ACTIONS).toContain('Change password');
    expect(STUDENT_UNSUPPORTED_INTEGRATION_ACTIONS.length).toBeGreaterThan(0);
    expect(STUDENT_UNSUPPORTED_ACCOUNT_ACTIONS).not.toContain('Delete account');
    expect(STUDENT_UNSUPPORTED_ACCOUNT_ACTIONS).toContain('Deactivate account');
  });
});
