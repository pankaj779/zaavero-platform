import { icons } from '../../../lib/constants';
import { settingsPageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const SettingsIcon = icons.settings;

export function SettingsEmptyState(): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={settingsPageCopy.emptyTitle}
      description={settingsPageCopy.emptyDescription}
      illustration={<SettingsIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
