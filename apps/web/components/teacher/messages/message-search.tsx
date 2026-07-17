'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherMessagesPageCopy } from '../../../lib/teacher';

export function MessageSearch({
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
      placeholder={teacherMessagesPageCopy.searchPlaceholder}
      ariaLabel={teacherMessagesPageCopy.searchLabel}
    />
  );
}
