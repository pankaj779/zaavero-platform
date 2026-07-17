import {
  settingsViewState,
  studentProfile,
  type SettingsViewState,
  type StudentProfileDto,
} from '../../../lib/dashboard';
import { AppearanceSection } from './appearance-section';
import { ConnectedAccountsSection } from './connected-accounts-section';
import { DangerZoneSection } from './danger-zone-section';
import { LanguageSection } from './language-section';
import { NotificationsSection } from './notifications-section';
import { PrivacySection } from './privacy-section';
import { SecuritySection } from './security-section';
import { SettingsEmptyState } from './settings-empty-state';
import { SettingsErrorState } from './settings-error-state';
import { SettingsHeader } from './settings-header';
import { SettingsSkeleton } from './settings-skeleton';
import { TimezoneSection } from './timezone-section';

export function SettingsView({
  profile = studentProfile,
  viewState = settingsViewState,
}: {
  profile?: StudentProfileDto | null;
  viewState?: SettingsViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <SettingsHeader />
        <SettingsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <SettingsHeader />
        <SettingsErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || !profile) {
    return (
      <div className="space-y-8">
        <SettingsHeader />
        <SettingsEmptyState />
      </div>
    );
  }

  const { preferences, connectedAccounts } = profile;

  return (
    <div className="space-y-8">
      <SettingsHeader />

      <div className="mx-auto grid max-w-3xl gap-4">
        <AppearanceSection defaultTheme={preferences.theme} />
        <NotificationsSection initialPreferences={preferences.notifications} />
        <SecuritySection />
        <LanguageSection initialLanguage={preferences.language} />
        <TimezoneSection initialTimezone={preferences.timezone} />
        <PrivacySection initialPreferences={preferences.privacy} />
        <ConnectedAccountsSection accounts={connectedAccounts} />
        <DangerZoneSection />
      </div>
    </div>
  );
}
