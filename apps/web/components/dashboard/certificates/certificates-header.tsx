import { PageHeader } from '@graphology/ui';
import { certificatesPageCopy } from '../../../lib/dashboard';

export function CertificatesHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={certificatesPageCopy.title}
      description={certificatesPageCopy.description}
    />
  );
}
