'use client';

import { useId } from 'react';
import {
  teacherCalendarEventFilterOptions,
  teacherCalendarPageCopy,
  type TeacherCalendarEventFilter,
} from '../../../lib/teacher';

export function CalendarFilters({
  value,
  onChange,
}: {
  value: TeacherCalendarEventFilter;
  onChange: (value: TeacherCalendarEventFilter) => void;
}): React.JSX.Element {
  const selectId = useId();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={selectId} className="text-caption text-muted-foreground">
        {teacherCalendarPageCopy.filterLabel}
      </label>
      <select
        id={selectId}
        value={value}
        aria-label={teacherCalendarPageCopy.filterLabel}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => {
          onChange(event.target.value as TeacherCalendarEventFilter);
        }}
      >
        {teacherCalendarEventFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
