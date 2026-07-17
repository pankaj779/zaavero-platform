import {
  getCertificateStats,
  certificatesPageCopy,
  type CertificateDto,
} from '../../../lib/dashboard';
import { DashboardStatGrid } from '../shared';

export function CertificateStats({ items }: { items: CertificateDto[] }): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getCertificateStats(items)}
      ariaLabel={certificatesPageCopy.statsLabel}
    />
  );
}
