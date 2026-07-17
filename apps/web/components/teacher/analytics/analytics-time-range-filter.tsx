'use client';

import { useId } from 'react';
import {
  teacherAnalyticsPageCopy,
  teacherAnalyticsTimeRangeOptions,
  type TeacherAnalyticsTimeRange,
} from '../../../lib/teacher';

export function AnalyticsTimeRangeFilter({
  value,
  onChange,
}: {
  value: TeacherAnalyticsTimeRange;
  onChange: (value: TeacherAnalyticsTimeRange) => void;
}): React.JSX.Element {
  const selectId = useId();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={selectId} className="text-caption text-muted-foreground">
        {teacherAnalyticsPageCopy.timeRangeLabel}
      </label>
      <select
        id={selectId}
        value={value}
        aria-label={teacherAnalyticsPageCopy.timeRangeLabel}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring laptop:min-w-40"
        onChange={(event) => {
          onChange(event.target.value as TeacherAnalyticsTimeRange);
        }}
      >
        {teacherAnalyticsTimeRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
