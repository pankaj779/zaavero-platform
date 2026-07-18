'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherCertificatesPageCopy } from '../../../lib/teacher';

export function CertificateSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  return (
    <DashboardSearch
      value={value}
      onChange={onChange}
      placeholder={teacherCertificatesPageCopy.searchPlaceholder}
      ariaLabel={teacherCertificatesPageCopy.searchLabel}
    />
  );
}
