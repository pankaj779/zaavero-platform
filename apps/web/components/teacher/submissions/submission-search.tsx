'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherSubmissionsPageCopy } from '../../../lib/teacher';

export function SubmissionSearch({
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
      placeholder={teacherSubmissionsPageCopy.searchPlaceholder}
      ariaLabel={teacherSubmissionsPageCopy.searchLabel}
    />
  );
}
