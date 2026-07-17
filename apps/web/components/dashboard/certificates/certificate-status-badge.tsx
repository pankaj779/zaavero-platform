import { Badge } from '@graphology/ui';
import {
  certificateStatusLabel,
  type CertificateStatus,
} from '../../../lib/dashboard';

const statusVariant: Record<
  CertificateStatus,
  'success' | 'secondary' | 'warning'
> = {
  issued: 'success',
  processing: 'secondary',
  locked: 'warning',
};

export function CertificateStatusBadge({
  status,
}: {
  status: CertificateStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{certificateStatusLabel[status]}</Badge>;
}
