import { PageHeader } from '@graphology/ui';
import { settingsPageCopy } from '../../../lib/dashboard';

export function SettingsHeader(): React.JSX.Element {
  return (
    <PageHeader title={settingsPageCopy.title} description={settingsPageCopy.description} />
  );
}
