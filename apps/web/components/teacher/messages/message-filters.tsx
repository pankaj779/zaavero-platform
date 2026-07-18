'use client';

import { useId } from 'react';
import {
  teacherMessageFilterOptions,
  teacherMessagesPageCopy,
  type TeacherMessageFilter,
} from '../../../lib/teacher';

export function MessageFilters({
  value,
  onChange,
  studentMode = false,
}: {
  value: TeacherMessageFilter;
  onChange: (value: TeacherMessageFilter) => void;
  studentMode?: boolean;
}): React.JSX.Element {
  const selectId = useId();
  const options = studentMode
    ? ([
        { value: 'all', label: 'All conversations' },
        { value: 'unread', label: 'Unread' },
        { value: 'students', label: 'Direct / mentor' },
        { value: 'batches', label: 'Course cohorts' },
        { value: 'announcements', label: 'Support' },
      ] satisfies { value: TeacherMessageFilter; label: string }[])
    : teacherMessageFilterOptions;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={selectId} className="text-caption text-muted-foreground">
        {teacherMessagesPageCopy.filterLabel}
      </label>
      <select
        id={selectId}
        value={value}
        aria-label={teacherMessagesPageCopy.filterLabel}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => {
          onChange(event.target.value as TeacherMessageFilter);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
