export const STUDENT_PREFERENCES_STORAGE_VERSION = 1 as const;

export type StudentThemePreference = 'system' | 'light' | 'dark';

export interface StudentPrivacyPreferences {
  showFullNameInDiscussions: boolean;
  allowMentorDirectMessages: boolean;
  shareProgressWithOrganization: boolean;
}

export interface StudentClientPreferences {
  version: typeof STUDENT_PREFERENCES_STORAGE_VERSION;
  theme: StudentThemePreference;
  language: string | null;
  timezone: string | null;
  inAppNotifications: boolean;
  privacy: StudentPrivacyPreferences;
}

export const DEFAULT_STUDENT_CLIENT_PREFERENCES: StudentClientPreferences = {
  version: STUDENT_PREFERENCES_STORAGE_VERSION,
  theme: 'system',
  language: null,
  timezone: null,
  inAppNotifications: true,
  privacy: {
    showFullNameInDiscussions: true,
    allowMentorDirectMessages: true,
    shareProgressWithOrganization: true,
  },
};

/** Versioned per-user localStorage key for client-only student preferences. */
export function studentPreferencesStorageKey(userId: string): string {
  return `graphology.student.preferences.v${String(STUDENT_PREFERENCES_STORAGE_VERSION)}.${userId}`;
}

function isTheme(value: unknown): value is StudentThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isPrivacy(value: unknown): value is StudentPrivacyPreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const privacy = value as Record<string, unknown>;
  return (
    typeof privacy.showFullNameInDiscussions === 'boolean' &&
    typeof privacy.allowMentorDirectMessages === 'boolean' &&
    typeof privacy.shareProgressWithOrganization === 'boolean'
  );
}

export function parseStudentClientPreferences(raw: string | null): StudentClientPreferences | null {
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StudentClientPreferences>;
    if (parsed.version !== STUDENT_PREFERENCES_STORAGE_VERSION) {
      return null;
    }
    if (!isTheme(parsed.theme)) {
      return null;
    }
    if (!isPrivacy(parsed.privacy)) {
      return null;
    }
    return {
      version: STUDENT_PREFERENCES_STORAGE_VERSION,
      theme: parsed.theme,
      language: typeof parsed.language === 'string' ? parsed.language : null,
      timezone: typeof parsed.timezone === 'string' ? parsed.timezone : null,
      inAppNotifications:
        typeof parsed.inAppNotifications === 'boolean'
          ? parsed.inAppNotifications
          : DEFAULT_STUDENT_CLIENT_PREFERENCES.inAppNotifications,
      privacy: parsed.privacy,
    };
  } catch {
    return null;
  }
}

export function loadStudentClientPreferences(
  userId: string,
  storage?: Pick<Storage, 'getItem'> | null,
): StudentClientPreferences {
  const store =
    storage ?? (typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage);
  if (store === null) {
    return {
      ...DEFAULT_STUDENT_CLIENT_PREFERENCES,
      privacy: { ...DEFAULT_STUDENT_CLIENT_PREFERENCES.privacy },
    };
  }
  const parsed = parseStudentClientPreferences(store.getItem(studentPreferencesStorageKey(userId)));
  if (parsed === null) {
    return {
      ...DEFAULT_STUDENT_CLIENT_PREFERENCES,
      privacy: { ...DEFAULT_STUDENT_CLIENT_PREFERENCES.privacy },
    };
  }
  return parsed;
}

export function saveStudentClientPreferences(
  userId: string,
  preferences: StudentClientPreferences,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const store =
    storage ?? (typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage);
  if (store === null) {
    return;
  }
  store.setItem(
    studentPreferencesStorageKey(userId),
    JSON.stringify({
      ...preferences,
      version: STUDENT_PREFERENCES_STORAGE_VERSION,
    }),
  );
}

export const STUDENT_UNSUPPORTED_SECURITY_ACTIONS = [
  'Change password',
  'Two-factor authentication',
  'Manage active sessions',
] as const;

export const STUDENT_UNSUPPORTED_INTEGRATION_ACTIONS = [
  'Connect Google',
  'Connect Microsoft',
  'Connect Zoom',
] as const;

export const STUDENT_UNSUPPORTED_ACCOUNT_ACTIONS = ['Change email', 'Deactivate account'] as const;
