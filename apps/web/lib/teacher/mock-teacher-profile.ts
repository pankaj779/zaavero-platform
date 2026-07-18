import { formatDashboardDate } from '../dashboard/format-date';

/**
 * Teacher Profile & Settings DTOs — shaped like a future GET /teachers/me response.
 * Avatar upload, profile editing, OAuth linking, password/2FA, and preference sync
 * remain opaque until backend integration.
 */

export type TeacherProfileViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherSettingsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherThemePreference = 'system' | 'light' | 'dark';
export type TeacherIntegrationAvailability = 'coming_soon';

export interface TeacherNotificationPreferencesDto {
  emailNotifications: boolean;
  assignmentReviews: boolean;
  liveClassReminders: boolean;
  studentMessages: boolean;
  marketingEmails: boolean;
}

export interface TeacherConnectedAccountDto {
  id: string;
  provider: 'google' | 'microsoft' | 'zoom';
  label: string;
  connected: boolean;
  /** Always null until OAuth linking is enabled. */
  externalAccountId: null;
}

export interface TeacherPreferencesDto {
  theme: TeacherThemePreference;
  language: string;
  timezone: string;
  notifications: TeacherNotificationPreferencesDto;
}

export interface TeacherProfileFutureFeaturesDto {
  avatarUpload: TeacherIntegrationAvailability;
  profileEditing: TeacherIntegrationAvailability;
  passwordChange: TeacherIntegrationAvailability;
  twoFactor: TeacherIntegrationAvailability;
  oauthLinking: TeacherIntegrationAvailability;
  preferenceSync: TeacherIntegrationAvailability;
}

export interface TeacherProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  /** Always null until avatar upload is integrated. */
  avatarUrl: null;
  bio: string;
  qualifications: string[];
  experienceYears: number;
  specializations: string[];
  timezone: string;
  language: string;
  joinedAt: string;
  preferences: TeacherPreferencesDto;
  connectedAccounts: TeacherConnectedAccountDto[];
  futureFeatures: TeacherProfileFutureFeaturesDto;
}

export const teacherProfileViewState: TeacherProfileViewState = 'populated';
export const teacherSettingsViewState: TeacherSettingsViewState = 'populated';

export const teacherProfilePageCopy = {
  title: 'Profile',
  description: 'Your teaching profile and professional details.',
  editProfile: 'Edit Profile',
  uploadAvatar: 'Upload Avatar',
  comingSoonNote: 'Backend integration coming soon',
  personalTitle: 'Personal Information',
  professionalTitle: 'Professional Information',
  teachingTitle: 'Teaching Information',
  accountTitle: 'Account',
  summaryLabel: 'Profile summary',
  firstNameLabel: 'First name',
  lastNameLabel: 'Last name',
  emailLabel: 'Email',
  phoneLabel: 'Phone',
  bioLabel: 'Bio',
  joinedLabel: 'Joined',
  timezoneLabel: 'Timezone',
  languageLabel: 'Language',
  qualificationsLabel: 'Qualifications',
  experienceLabel: 'Experience',
  specializationsLabel: 'Specializations',
  roleLabel: 'Role',
  avatarAlt: 'Teacher avatar placeholder',
  phonePlaceholder: 'Phone not set',
  yearsSuffix: 'years',
  emptyTitle: 'Profile unavailable',
  emptyDescription: 'Your teaching profile will appear here once account data is connected.',
  errorTitle: 'Unable to load profile',
  errorDescription: 'Something went wrong while loading your profile. Please try again.',
} as const;

export const teacherSettingsPageCopy = {
  title: 'Settings',
  description: 'Appearance, notifications, and account preferences for your teaching workspace.',
  comingSoonNote: 'Backend integration coming soon',
  appearanceTitle: 'Appearance',
  appearanceDescription: 'Choose how the Teacher Portal theme appears on this device.',
  themeLabel: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  notificationsTitle: 'Notifications',
  notificationsDescription:
    'Preference toggles are local placeholders until notification sync is connected.',
  emailNotifications: 'Email notifications',
  assignmentReviews: 'Assignment review alerts',
  liveClassReminders: 'Live class reminders',
  studentMessages: 'Student message alerts',
  marketingEmails: 'Product updates',
  languageTitle: 'Language',
  languageDescription: 'Display language preference (local only until sync lands).',
  timezoneTitle: 'Timezone',
  timezoneDescription: 'Scheduling timezone preference (local only until sync lands).',
  connectedTitle: 'Connected Accounts',
  connectedDescription: 'OAuth account linking is not enabled yet.',
  connected: 'Connected',
  notConnected: 'Not connected',
  connect: 'Connect',
  disconnect: 'Disconnect',
  securityTitle: 'Security',
  securityDescription: 'Account security controls open after backend integration.',
  changePassword: 'Change Password',
  twoFactor: 'Two-factor Authentication',
  activeSessions: 'Active Sessions',
  dangerTitle: 'Danger Zone',
  dangerDescription: 'Destructive account actions remain disabled.',
  deleteAccount: 'Delete Account',
  deactivateAccount: 'Deactivate Account',
  emptyTitle: 'Settings unavailable',
  emptyDescription: 'Settings will appear here once preference data is connected.',
  errorTitle: 'Unable to load settings',
  errorDescription: 'Something went wrong while loading settings. Please try again.',
} as const;

export const teacherThemePreferenceLabel: Record<TeacherThemePreference, string> = {
  system: teacherSettingsPageCopy.themeSystem,
  light: teacherSettingsPageCopy.themeLight,
  dark: teacherSettingsPageCopy.themeDark,
};

const comingSoonFeatures: TeacherProfileFutureFeaturesDto = {
  avatarUpload: 'coming_soon',
  profileEditing: 'coming_soon',
  passwordChange: 'coming_soon',
  twoFactor: 'coming_soon',
  oauthLinking: 'coming_soon',
  preferenceSync: 'coming_soon',
};

/** Honest defaults for fields that the current auth/profile backend does not expose. */
export const teacherProfileDefaults: Omit<
  TeacherProfileDto,
  'id' | 'firstName' | 'lastName' | 'email'
> = {
  phone: null,
  avatarUrl: null,
  bio: '',
  qualifications: [],
  experienceYears: 0,
  specializations: [],
  timezone: 'UTC',
  language: 'en',
  joinedAt: '',
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      emailNotifications: true,
      assignmentReviews: true,
      liveClassReminders: true,
      studentMessages: true,
      marketingEmails: false,
    },
  },
  connectedAccounts: [
    {
      id: 'tconn_google',
      provider: 'google',
      label: 'Google',
      connected: false,
      externalAccountId: null,
    },
    {
      id: 'tconn_microsoft',
      provider: 'microsoft',
      label: 'Microsoft',
      connected: false,
      externalAccountId: null,
    },
    {
      id: 'tconn_zoom',
      provider: 'zoom',
      label: 'Zoom',
      connected: false,
      externalAccountId: null,
    },
  ],
  futureFeatures: comingSoonFeatures,
};

export function buildTeacherProfileFromAuth(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}): TeacherProfileDto {
  return {
    ...teacherProfileDefaults,
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export function getTeacherDisplayName(profile: TeacherProfileDto): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

export function formatTeacherProfileDate(iso: string): string {
  return formatDashboardDate(iso);
}

export function getTeacherLanguageLabel(code: string): string {
  if (code === 'en') {
    return 'English';
  }
  return `Language placeholder (${code})`;
}
