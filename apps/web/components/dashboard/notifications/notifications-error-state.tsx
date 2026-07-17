import { notificationsPageCopy } from '../../../lib/dashboard';
import { ErrorState } from '../error-state';

export function NotificationsErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={notificationsPageCopy.errorTitle}
      description={notificationsPageCopy.errorDescription}
    />
  );
}
