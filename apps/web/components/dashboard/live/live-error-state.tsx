import { livePageCopy } from '../../../lib/dashboard';
import { ErrorState } from '../error-state';

export function LiveErrorState(): React.JSX.Element {
  return (
    <ErrorState title={livePageCopy.errorTitle} description={livePageCopy.errorDescription} />
  );
}
