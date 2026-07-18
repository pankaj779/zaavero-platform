import { Badge } from '@graphology/ui';
import { teacherCertificateStatusLabel, type StudentCertificateStatus } from '../../../lib/teacher';

const statusVariant: Record<
  StudentCertificateStatus,
  'success' | 'warning' | 'primary' | 'neutral'
> = {
  eligible: 'primary',
  pending: 'warning',
  issued: 'success',
  revoked: 'neutral',
};

export function CertificateStatusBadge({
  status,
}: {
  status: StudentCertificateStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{teacherCertificateStatusLabel[status]}</Badge>;
}
