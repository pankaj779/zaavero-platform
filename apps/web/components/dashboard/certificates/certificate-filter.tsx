'use client';

import {
  certificateSortOptions,
  certificateStatusFilterOptions,
  certificatesPageCopy,
  type CertificateSortOption,
  type CertificateStatusFilter,
} from '../../../lib/dashboard';
import { DashboardStatusSortFilters } from '../shared';

export function CertificateFilter({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: CertificateStatusFilter;
  sort: CertificateSortOption;
  onStatusChange: (value: CertificateStatusFilter) => void;
  onSortChange: (value: CertificateSortOption) => void;
}): React.JSX.Element {
  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={certificateStatusFilterOptions}
      sortOptions={certificateSortOptions}
      statusFilterLabel={certificatesPageCopy.statusFilterLabel}
      sortLabel={certificatesPageCopy.sortLabel}
      statusSelectId="certificate-status-filter"
      sortSelectId="certificate-sort"
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
