'use client';

import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@graphology/ui';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherLessonContentTypeFilterOptions,
  teacherLessonSortOptions,
  teacherLessonsPageCopy,
  type TeacherLessonContentTypeFilter,
  type TeacherLessonSortOption,
} from '../../../lib/teacher';

export function LessonFilters({
  contentType,
  courseId,
  courseOptions,
  sort,
  onContentTypeChange,
  onCourseChange,
  onSortChange,
}: {
  contentType: TeacherLessonContentTypeFilter;
  courseId: string;
  courseOptions: readonly { value: string; label: string }[];
  sort: TeacherLessonSortOption;
  onContentTypeChange: (value: TeacherLessonContentTypeFilter) => void;
  onCourseChange: (value: string) => void;
  onSortChange: (value: TeacherLessonSortOption) => void;
}): React.JSX.Element {
  const contentTypeSelectId = useId();
  const courseSelectId = useId();
  const sortSelectId = useId();
  const copy = teacherLessonsPageCopy;

  return (
    <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-center">
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

      <DashboardStatusSortFilters
        status={contentType}
        sort={sort}
        statusOptions={teacherLessonContentTypeFilterOptions}
        sortOptions={teacherLessonSortOptions}
        statusFilterLabel={copy.contentTypeFilterLabel}
        sortLabel={copy.sortLabel}
        statusSelectId={contentTypeSelectId}
        sortSelectId={sortSelectId}
        onStatusChange={onContentTypeChange}
        onSortChange={onSortChange}
      />
    </div>
  );
}
