import { certificatesPageCopy } from '../../../lib/dashboard';
import { ErrorState } from '../error-state';

export function CertificateErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={certificatesPageCopy.errorTitle}
      description={certificatesPageCopy.errorDescription}
    />
  );
}
