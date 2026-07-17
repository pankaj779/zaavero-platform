/**
 * Student Profile & Settings DTOs — shaped like future GET /student/profile responses.
 * Honest placeholders only: avatarUrl null, no fake OAuth links.
 */

import { formatDashboardDate } from './format-date';

export type ProfileViewState = 'loading' | 'empty' | 'error' | 'populated';
export type SettingsViewState = 'loading' | 'empty' | 'error' | 'populated';

export type AccountStatus = 'active' | 'pending_verification' | 'suspended' | 'inactive';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ProfileOrganizationDto {
  id: string;
  name: string;
  role: string;
}

export interface ProfileAcademicDto {
  enrolledProgramsLabel: string;
  learnerLevelLabel: string;
  learningGoalPlaceholder: string;
}

export interface NotificationPreferencesDto {
  emailNotifications: boolean;
  assignmentReminders: boolean;
  liveClassReminders: boolean;
  marketingEmails: boolean;
}

export interface PrivacyPreferencesDto {
  showFullNameInDiscussions: boolean;
  allowMentorDirectMessages: boolean;
  shareProgressWithOrganization: boolean;
}

export interface ConnectedAccountDto {
  id: string;
  provider: 'google' | 'microsoft' | 'linkedin';
  label: string;
  connected: boolean;
  /** Always null until OAuth linking is enabled */
  externalAccountId: string | null;
}

export interface StudentPreferencesDto {
  theme: ThemePreference;
  language: string;
  timezone: string;
  notifications: NotificationPreferencesDto;
  privacy: PrivacyPreferencesDto;
}

/** Future expansion — architecture only */
export interface ProfileFutureFeaturesDto {
  avatarUploadEnabled: boolean;
  profileEditingEnabled: boolean;
  passwordChangeEnabled: boolean;
  twoFactorEnabled: boolean;
  oauthLinkingEnabled: boolean;
  notificationPreferencesEnabled: boolean;
  auditHistoryEnabled: boolean;
  organizationSwitchingEnabled: boolean;
}

export interface StudentProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  /** Always null until avatar upload exists */
  avatarUrl: string | null;
  bio: string;
  timezone: string;
  language: string;
  joinedAt: string;
  organization: ProfileOrganizationDto;
  academic: ProfileAcademicDto;
  accountStatus: AccountStatus;
  preferences: StudentPreferencesDto;
  connectedAccounts: ConnectedAccountDto[];
  futureFeatures: ProfileFutureFeaturesDto;
}

export const profileViewState: ProfileViewState = 'populated';
export const settingsViewState: SettingsViewState = 'populated';

export const profilePageCopy = {
  title: 'Profile',
  description: 'View your learner profile. Editing will be available in a later release.',
  editProfile: 'Edit Profile',
  comingSoon: 'Coming Soon',
  personalTitle: 'Personal Information',
  academicTitle: 'Academic Information',
  organizationTitle: 'Organization',
  accountStatusTitle: 'Account Status',
  summaryLabel: 'Profile summary',
  firstNameLabel: 'First name',
  lastNameLabel: 'Last name',
  emailLabel: 'Email',
  phoneLabel: 'Phone',
  bioLabel: 'Bio',
  joinedLabel: 'Joined',
  timezoneLabel: 'Timezone',
  languageLabel: 'Language',
  roleLabel: 'Role',
  orgNameLabel: 'Organization',
  enrolledLabel: 'Programs',
  levelLabel: 'Learner level',
  goalLabel: 'Learning goal',
  avatarAlt: 'Profile avatar placeholder',
  emptyTitle: 'Profile unavailable',
  emptyDescription: 'Your profile will appear here once account data is connected.',
  errorTitle: 'Unable to load profile',
  errorDescription: 'Something went wrong while loading your profile. Please try again.',
  phonePlaceholder: 'Phone not set',
} as const;

export const settingsPageCopy = {
  title: 'Settings',
  description: 'Manage appearance and preference placeholders. Most actions remain disabled for now.',
  appearanceTitle: 'Appearance',
  appearanceDescription: 'Choose how the dashboard theme appears on this device.',
  themeLabel: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  notificationsTitle: 'Notifications',
  notificationsDescription: 'Preference toggles are local placeholders until notifications are connected.',
  emailNotifications: 'Email notifications',
  assignmentReminders: 'Assignment reminders',
  liveClassReminders: 'Live class reminders',
  marketingEmails: 'Marketing emails',
  securityTitle: 'Security',
  securityDescription: 'Account security controls will open in a later release.',
  changePassword: 'Change Password',
  twoFactor: 'Two-factor Authentication',
  activeSessions: 'Active Sessions',
  languageTitle: 'Language',
  languageDescription: 'Display language preference placeholder.',
  timezoneTitle: 'Timezone',
  timezoneDescription: 'Scheduling timezone preference placeholder.',
  privacyTitle: 'Privacy',
  privacyDescription: 'Privacy controls are UI-only placeholders.',
  showFullName: 'Show full name in discussions',
  allowMentorDm: 'Allow mentor direct messages',
  shareProgress: 'Share progress with organization',
  connectedTitle: 'Connected Accounts',
  connectedDescription: 'OAuth account linking is not enabled yet.',
  connected: 'Connected',
  notConnected: 'Not connected',
  connect: 'Connect',
  disconnect: 'Disconnect',
  dangerTitle: 'Danger Zone',
  dangerDescription: 'Destructive account actions remain disabled.',
  deleteAccount: 'Delete Account',
  deactivateAccount: 'Deactivate Account',
  comingSoon: 'Coming Soon',
  emptyTitle: 'Settings unavailable',
  emptyDescription: 'Settings will appear here once preference data is connected.',
  errorTitle: 'Unable to load settings',
  errorDescription: 'Something went wrong while loading settings. Please try again.',
} as const;

export const accountStatusLabel: Record<AccountStatus, string> = {
  active: 'Active',
  pending_verification: 'Pending verification',
  suspended: 'Suspended',
  inactive: 'Inactive',
};

export const themePreferenceLabel: Record<ThemePreference, string> = {
  system: settingsPageCopy.themeSystem,
  light: settingsPageCopy.themeLight,
  dark: settingsPageCopy.themeDark,
};

const defaultFutureFeatures: ProfileFutureFeaturesDto = {
  avatarUploadEnabled: false,
  profileEditingEnabled: false,
  passwordChangeEnabled: false,
  twoFactorEnabled: false,
  oauthLinkingEnabled: false,
  notificationPreferencesEnabled: false,
  auditHistoryEnabled: false,
  organizationSwitchingEnabled: false,
};

export const studentProfile: StudentProfileDto = {
  id: 'user_001',
  firstName: 'Student',
  lastName: 'Placeholder',
  email: 'student.placeholder@example.com',
  phone: null,
  avatarUrl: null,
  bio: 'Bio placeholder. Share a short introduction when profile editing is enabled.',
  timezone: 'Asia/Kolkata',
  language: 'en',
  joinedAt: '2026-01-15T10:00:00.000Z',
  organization: {
    id: 'org_001',
    name: 'Organization Placeholder',
    role: 'Student',
  },
  academic: {
    enrolledProgramsLabel: 'Enrolled programs placeholder',
    learnerLevelLabel: 'Learner level placeholder',
    learningGoalPlaceholder: 'Learning goal placeholder',
  },
  accountStatus: 'active',
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'Asia/Kolkata',
    notifications: {
      emailNotifications: true,
      assignmentReminders: true,
      liveClassReminders: true,
      marketingEmails: false,
    },
    privacy: {
      showFullNameInDiscussions: true,
      allowMentorDirectMessages: true,
      shareProgressWithOrganization: false,
    },
  },
  connectedAccounts: [
    {
      id: 'conn_google',
      provider: 'google',
      label: 'Google',
      connected: false,
      externalAccountId: null,
    },
    {
      id: 'conn_microsoft',
      provider: 'microsoft',
      label: 'Microsoft',
      connected: false,
      externalAccountId: null,
    },
    {
      id: 'conn_linkedin',
      provider: 'linkedin',
      label: 'LinkedIn',
      connected: false,
      externalAccountId: null,
    },
  ],
  futureFeatures: defaultFutureFeatures,
};

export function getStudentDisplayName(profile: StudentProfileDto = studentProfile): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

export function formatProfileDate(iso: string): string {
  return formatDashboardDate(iso);
}

export function getLanguageLabel(code: string): string {
  if (code === 'en') {
    return 'English';
  }
  return `Language placeholder (${code})`;
}
