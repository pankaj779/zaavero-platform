'use client';

import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@graphology/ui';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  attendanceSortOptions,
  attendanceStatusFilterOptions,
  teacherAttendancePageCopy,
  type AttendanceSortOption,
  type AttendanceStatusFilter,
} from '../../../lib/teacher';

export function AttendanceFilters({
  status,
  sort,
  courseId = 'all',
  batchId = 'all',
  liveSessionId = 'all',
  courseOptions = [{ value: 'all', label: 'All Courses' }],
  batchOptions = [{ value: 'all', label: 'All Batches' }],
  liveSessionOptions = [{ value: 'all', label: 'All Live Sessions' }],
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
  onLiveSessionChange,
}: {
  status: AttendanceStatusFilter;
  sort: AttendanceSortOption;
  courseId?: string;
  batchId?: string;
  liveSessionId?: string;
  courseOptions?: readonly { value: string; label: string }[];
  batchOptions?: readonly { value: string; label: string }[];
  liveSessionOptions?: readonly { value: string; label: string }[];
  onStatusChange: (value: AttendanceStatusFilter) => void;
  onSortChange: (value: AttendanceSortOption) => void;
  onCourseChange?: (value: string) => void;
  onBatchChange?: (value: string) => void;
  onLiveSessionChange?: (value: string) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();
  const courseSelectId = useId();
  const batchSelectId = useId();
  const liveSessionSelectId = useId();
  const copy = teacherAttendancePageCopy;

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

      {onLiveSessionChange ? (
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={liveSessionSelectId}>
            {copy.liveSessionFilterLabel}
          </label>
          <Select value={liveSessionId} onValueChange={onLiveSessionChange}>
            <SelectTrigger id={liveSessionSelectId} aria-label={copy.liveSessionFilterLabel}>
              <SelectValue placeholder={copy.allLiveSessionsLabel} />
            </SelectTrigger>
            <SelectContent>
              {liveSessionOptions.map((option) => (
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
        statusOptions={attendanceStatusFilterOptions}
        sortOptions={attendanceSortOptions}
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
