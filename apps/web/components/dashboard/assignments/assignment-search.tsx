'use client';

import { assignmentsPageCopy } from '../../../lib/dashboard';
import { DashboardSearch } from '../shared';

export function AssignmentSearch({
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
      placeholder={assignmentsPageCopy.searchPlaceholder}
      ariaLabel={assignmentsPageCopy.searchLabel}
    />
  );
}
