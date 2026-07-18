'use client';

import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@graphology/ui';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherSubmissionSortOptions,
  teacherSubmissionStatusFilterOptions,
  teacherSubmissionsPageCopy,
  type TeacherSubmissionSortOption,
  type TeacherSubmissionStatusFilter,
} from '../../../lib/teacher';

export function SubmissionFilters({
  status,
  sort,
  assignmentId = 'all',
  assignmentOptions = [{ value: 'all', label: 'All Assignments' }],
  onStatusChange,
  onSortChange,
  onAssignmentChange,
}: {
  status: TeacherSubmissionStatusFilter;
  sort: TeacherSubmissionSortOption;
  assignmentId?: string;
  assignmentOptions?: readonly { value: string; label: string }[];
  onStatusChange: (value: TeacherSubmissionStatusFilter) => void;
  onSortChange: (value: TeacherSubmissionSortOption) => void;
  onAssignmentChange?: (value: string) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();
  const assignmentSelectId = useId();
  const copy = teacherSubmissionsPageCopy;

  return (
    <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:flex-wrap tablet:items-center">
      {onAssignmentChange ? (
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={assignmentSelectId}>
            {copy.assignmentFilterLabel}
          </label>
          <Select value={assignmentId} onValueChange={onAssignmentChange}>
            <SelectTrigger id={assignmentSelectId} aria-label={copy.assignmentFilterLabel}>
              <SelectValue placeholder={copy.allAssignmentsLabel} />
            </SelectTrigger>
            <SelectContent>
              {assignmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <DashboardStatusSortFilters
        status={status}
        sort={sort}
        statusOptions={teacherSubmissionStatusFilterOptions}
        sortOptions={teacherSubmissionSortOptions}
        statusFilterLabel={copy.statusFilterLabel}
        sortLabel={copy.sortLabel}
        statusSelectId={statusSelectId}
        sortSelectId={sortSelectId}
        onStatusChange={onStatusChange}
        onSortChange={onSortChange}
      />
    </div>
  );
}
