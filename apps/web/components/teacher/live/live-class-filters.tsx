'use client';

import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@graphology/ui';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherLiveClassProviderFilterOptions,
  teacherLiveClassSortOptions,
  teacherLiveClassStatusFilterOptions,
  teacherLiveClassesPageCopy,
  type TeacherLiveClassProviderFilter,
  type TeacherLiveClassSortOption,
  type TeacherLiveClassStatusFilter,
} from '../../../lib/teacher';

export function LiveClassFilters({
  status,
  sort,
  courseId = 'all',
  batchId = 'all',
  provider = 'all',
  courseOptions = [{ value: 'all', label: 'All Courses' }],
  batchOptions = [{ value: 'all', label: 'All Batches' }],
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
  onProviderChange,
}: {
  status: TeacherLiveClassStatusFilter;
  sort: TeacherLiveClassSortOption;
  courseId?: string;
  batchId?: string;
  provider?: TeacherLiveClassProviderFilter;
  courseOptions?: readonly { value: string; label: string }[];
  batchOptions?: readonly { value: string; label: string }[];
  onStatusChange: (value: TeacherLiveClassStatusFilter) => void;
  onSortChange: (value: TeacherLiveClassSortOption) => void;
  onCourseChange?: (value: string) => void;
  onBatchChange?: (value: string) => void;
  onProviderChange?: (value: TeacherLiveClassProviderFilter) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();
  const courseSelectId = useId();
  const batchSelectId = useId();
  const providerSelectId = useId();
  const copy = teacherLiveClassesPageCopy;

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

      {onProviderChange ? (
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={providerSelectId}>
            {copy.providerFilterLabel}
          </label>
          <Select
            value={provider}
            onValueChange={(value) => {
              onProviderChange(value as TeacherLiveClassProviderFilter);
            }}
          >
            <SelectTrigger id={providerSelectId} aria-label={copy.providerFilterLabel}>
              <SelectValue placeholder={copy.allProvidersLabel} />
            </SelectTrigger>
            <SelectContent>
              {teacherLiveClassProviderFilterOptions.map((option) => (
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
        statusOptions={teacherLiveClassStatusFilterOptions}
        sortOptions={teacherLiveClassSortOptions}
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
