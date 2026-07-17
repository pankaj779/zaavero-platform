import { PageHeader } from '@graphology/ui';
import { profilePageCopy } from '../../../lib/dashboard';

export function ProfileHeader(): React.JSX.Element {
  return <PageHeader title={profilePageCopy.title} description={profilePageCopy.description} />;
}
