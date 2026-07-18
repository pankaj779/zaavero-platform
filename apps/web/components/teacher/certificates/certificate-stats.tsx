import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherCertificateStats, type StudentCertificateDto } from '../../../lib/teacher';

export function CertificateStats({
  certificates,
}: {
  certificates: StudentCertificateDto[];
}): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getTeacherCertificateStats(certificates)}
      ariaLabel="Certificate statistics"
    />
  );
}
