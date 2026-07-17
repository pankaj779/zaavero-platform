import { icons } from '../../../lib/constants';
import { certificatesPageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const AwardIcon = icons.award;

export function CertificateEmptyState(): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={certificatesPageCopy.emptyTitle}
      description={certificatesPageCopy.emptyDescription}
      illustration={<AwardIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
