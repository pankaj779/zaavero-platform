'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherCertificateSortOptions,
  teacherCertificateStatusFilterOptions,
  teacherCertificatesPageCopy,
  type TeacherCertificateSortOption,
  type TeacherCertificateStatusFilter,
} from '../../../lib/teacher';

export function CertificateFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherCertificateStatusFilter;
  sort: TeacherCertificateSortOption;
  onStatusChange: (value: TeacherCertificateStatusFilter) => void;
  onSortChange: (value: TeacherCertificateSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherCertificateStatusFilterOptions}
      sortOptions={teacherCertificateSortOptions}
      statusFilterLabel={teacherCertificatesPageCopy.statusFilterLabel}
      sortLabel={teacherCertificatesPageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
