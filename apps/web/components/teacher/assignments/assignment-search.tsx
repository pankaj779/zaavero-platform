'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherAssignmentsPageCopy } from '../../../lib/teacher';

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
      placeholder={teacherAssignmentsPageCopy.searchPlaceholder}
      ariaLabel={teacherAssignmentsPageCopy.searchLabel}
    />
  );
}
