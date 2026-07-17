'use client';

import { certificatesPageCopy } from '../../../lib/dashboard';
import { DashboardSearch } from '../shared';

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
      placeholder={certificatesPageCopy.searchPlaceholder}
      ariaLabel={certificatesPageCopy.searchLabel}
    />
  );
}
