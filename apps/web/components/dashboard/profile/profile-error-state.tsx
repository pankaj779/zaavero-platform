import { profilePageCopy } from '../../../lib/dashboard';
import { ErrorState } from '../error-state';

export function ProfileErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={profilePageCopy.errorTitle}
      description={profilePageCopy.errorDescription}
    />
  );
}
