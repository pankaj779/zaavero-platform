import { settingsPageCopy } from '../../../lib/dashboard';
import { ErrorState } from '../error-state';

export function SettingsErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={settingsPageCopy.errorTitle}
      description={settingsPageCopy.errorDescription}
    />
  );
}
