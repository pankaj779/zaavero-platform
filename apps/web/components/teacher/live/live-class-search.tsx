'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherLiveClassesPageCopy } from '../../../lib/teacher';

export function LiveClassSearch({
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
      placeholder={teacherLiveClassesPageCopy.searchPlaceholder}
      ariaLabel={teacherLiveClassesPageCopy.searchLabel}
    />
  );
}
