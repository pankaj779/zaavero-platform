'use client';

import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@graphology/ui';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherAssignmentSortOptions,
  teacherAssignmentStatusFilterOptions,
  teacherAssignmentsPageCopy,
  type TeacherAssignmentSortOption,
  type TeacherAssignmentStatusFilter,
} from '../../../lib/teacher';

export function AssignmentFilters({
  status,
  sort,
  courseId = 'all',
  batchId = 'all',
  courseOptions = [{ value: 'all', label: 'All Courses' }],
  batchOptions = [{ value: 'all', label: 'All Batches' }],
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
}: {
  status: TeacherAssignmentStatusFilter;
  sort: TeacherAssignmentSortOption;
  courseId?: string;
  batchId?: string;
  courseOptions?: readonly { value: string; label: string }[];
  batchOptions?: readonly { value: string; label: string }[];
  onStatusChange: (value: TeacherAssignmentStatusFilter) => void;
  onSortChange: (value: TeacherAssignmentSortOption) => void;
  onCourseChange?: (value: string) => void;
  onBatchChange?: (value: string) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();
  const courseSelectId = useId();
  const batchSelectId = useId();
  const copy = teacherAssignmentsPageCopy;

  return (
    <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:flex-wrap tablet:items-center">
      {onCourseChange ? (
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={courseSelectId}>
            {copy.courseFilterLabel}
          </label>
          <Select value={courseId} onValueChange={onCourseChange}>
            <SelectTrigger id={courseSelectId} aria-label={copy.courseFilterLabel}>
              <SelectValue placeholder={copy.allCoursesLabel} />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {onBatchChange ? (
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={batchSelectId}>
            {copy.batchFilterLabel}
          </label>
          <Select value={batchId} onValueChange={onBatchChange}>
            <SelectTrigger id={batchSelectId} aria-label={copy.batchFilterLabel}>
              <SelectValue placeholder={copy.allBatchesLabel} />
            </SelectTrigger>
            <SelectContent>
              {batchOptions.map((option) => (
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
        statusOptions={teacherAssignmentStatusFilterOptions}
        sortOptions={teacherAssignmentSortOptions}
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
