import { PageHeader } from '@graphology/ui';
import { livePageCopy } from '../../../lib/dashboard';

export function LiveHeader(): React.JSX.Element {
  return <PageHeader title={livePageCopy.title} description={livePageCopy.description} />;
}
