import { PageHeader } from '@graphology/ui';
import { notificationsPageCopy } from '../../../lib/dashboard';

export function NotificationsHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={notificationsPageCopy.title}
      description={notificationsPageCopy.description}
    />
  );
}
