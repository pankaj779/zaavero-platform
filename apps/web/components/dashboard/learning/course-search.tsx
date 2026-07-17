'use client';

import { learningPageCopy } from '../../../lib/dashboard';
import { DashboardSearch } from '../shared';

export function CourseSearch({
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
      placeholder={learningPageCopy.searchPlaceholder}
      ariaLabel={learningPageCopy.searchLabel}
    />
  );
}
