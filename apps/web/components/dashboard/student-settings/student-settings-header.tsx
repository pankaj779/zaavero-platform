import { PageHeader } from '@graphology/ui';
import { studentSettingsCopy } from './copy';

export function StudentSettingsHeader(): React.JSX.Element {
  return (
    <PageHeader title={studentSettingsCopy.title} description={studentSettingsCopy.description} />
  );
}
