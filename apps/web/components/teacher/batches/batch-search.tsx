'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherBatchesPageCopy } from '../../../lib/teacher';

export function BatchSearch({
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
      placeholder={teacherBatchesPageCopy.searchPlaceholder}
      ariaLabel={teacherBatchesPageCopy.searchLabel}
    />
  );
}
