'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '../../../lib/auth';
import { TeacherModuleErrorState } from '../../teacher/shared';
import { studentSettingsCopy } from './copy';
import {
  DEFAULT_STUDENT_CLIENT_PREFERENCES,
  loadStudentClientPreferences,
  saveStudentClientPreferences,
  type StudentClientPreferences,
} from './preferences-storage';
import {
  StudentAccountActionsSection,
  StudentAppearanceSection,
  StudentIntegrationsSection,
  StudentLanguageSection,
  StudentNotificationsSection,
  StudentPrivacySection,
  StudentSecuritySection,
  StudentTimezoneSection,
} from './student-settings-sections';
import { StudentSettingsHeader } from './student-settings-header';
import { StudentSettingsSkeleton } from './student-settings-skeleton';

export function StudentSettingsView(): React.JSX.Element {
  const { user, loading, isAuthenticated } = useAuth();
  const { setTheme } = useTheme();
  const [preferences, setPreferences] = useState<StudentClientPreferences>(
    DEFAULT_STUDENT_CLIENT_PREFERENCES,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!isAuthenticated || user === null) {
      setHydrated(true);
      return;
    }
    const stored = loadStudentClientPreferences(user.id);
    setPreferences(stored);
    setTheme(stored.theme);
    setHydrated(true);
  }, [isAuthenticated, loading, setTheme, user]);

  const persist = useCallback(
    (next: StudentClientPreferences) => {
      setPreferences(next);
      if (user?.id) {
        saveStudentClientPreferences(user.id, next);
      }
    },
    [user?.id],
  );

  if (loading || !hydrated) {
    return (
      <div className="space-y-8">
        <StudentSettingsHeader />
        <StudentSettingsSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || user === null) {
    return (
      <div className="space-y-8">
        <StudentSettingsHeader />
        <TeacherModuleErrorState
          title={studentSettingsCopy.errorTitle}
          description={studentSettingsCopy.errorDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentSettingsHeader />
      <div className="mx-auto grid max-w-3xl gap-4">
        <StudentAppearanceSection
          theme={preferences.theme}
          onThemeChange={(theme) => {
            persist({ ...preferences, theme });
          }}
        />
        <StudentLanguageSection
          language={preferences.language}
          onLanguageChange={(language) => {
            persist({ ...preferences, language });
          }}
        />
        <StudentTimezoneSection
          timezone={preferences.timezone}
          onTimezoneChange={(timezone) => {
            persist({ ...preferences, timezone });
          }}
        />
        <StudentNotificationsSection
          enabled={preferences.inAppNotifications}
          onChange={(inAppNotifications) => {
            persist({ ...preferences, inAppNotifications });
          }}
        />
        <StudentPrivacySection
          privacy={preferences.privacy}
          onChange={(privacy) => {
            persist({ ...preferences, privacy });
          }}
        />
        <StudentSecuritySection />
        <StudentIntegrationsSection />
        <StudentAccountActionsSection />
      </div>
    </div>
  );
}
