'use client';

import { useMemo } from 'react';
import { type TeacherProfileDto } from '../../../lib/teacher';
import { AppearanceSection } from './appearance-section';
import { ConnectedAccountsSection } from './connected-accounts-section';
import { DangerZoneSection } from './danger-zone-section';
import { LanguageSection } from './language-section';
import { SecuritySection } from './security-section';
import { TimezoneSection } from './timezone-section';

/** Client island for settings not yet represented by server profile endpoints. */
export function TeacherSettingsSections({
  profile,
}: {
  profile: TeacherProfileDto;
}): React.JSX.Element {
  const preferenceGroups = useMemo(
    () => ({
      theme: profile.preferences.theme,
      language: profile.preferences.language,
      timezone: profile.preferences.timezone,
      connectedAccounts: profile.connectedAccounts,
    }),
    [profile],
  );

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <AppearanceSection defaultTheme={preferenceGroups.theme} />
      <LanguageSection initialLanguage={preferenceGroups.language} />
      <TimezoneSection initialTimezone={preferenceGroups.timezone} />
      <ConnectedAccountsSection accounts={preferenceGroups.connectedAccounts} />
      <SecuritySection />
      <DangerZoneSection />
    </div>
  );
}
