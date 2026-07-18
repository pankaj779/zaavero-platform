'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherLessonsPageCopy } from '../../../lib/teacher';

export function LessonSearch({
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
      placeholder={teacherLessonsPageCopy.searchPlaceholder}
      ariaLabel={teacherLessonsPageCopy.searchLabel}
    />
  );
}
