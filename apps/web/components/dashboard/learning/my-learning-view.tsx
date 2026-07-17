'use client';

import { useMemo, useState } from 'react';
import {
  enrolledCourses,
  filterEnrolledCourses,
  learningPageCopy,
  learningViewState,
  sortEnrolledCourses,
  type CourseSortOption,
  type CourseStatusFilter,
  type EnrolledCourseDto,
  type LearningViewState,
} from '../../../lib/dashboard';
import { ErrorState } from '../error-state';
import { CourseFilters } from './course-filters';
import { CourseGrid } from './course-grid';
import { CourseSearch } from './course-search';
import { LearningEmptyState } from './learning-empty-state';
import { LearningHeader } from './learning-header';
import { LearningSkeleton } from './learning-skeleton';
import { LearningStats } from './learning-stats';

export function MyLearningView({
  courses = enrolledCourses,
  viewState = learningViewState,
}: {
  courses?: EnrolledCourseDto[];
  viewState?: LearningViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CourseStatusFilter>('all');
  const [sort, setSort] = useState<CourseSortOption>('recent');

  const visibleCourses = useMemo(() => {
    const filtered = filterEnrolledCourses(courses, query, status);
    return sortEnrolledCourses(filtered, sort);
  }, [courses, query, sort, status]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <LearningHeader />
        <LearningSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <LearningHeader />
        <ErrorState
          title={learningPageCopy.errorTitle}
          description={learningPageCopy.errorDescription}
        />
      </div>
    );
  }

  if (viewState === 'empty' || courses.length === 0) {
    return (
      <div className="space-y-8">
        <LearningHeader />
        <LearningEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LearningHeader />

      <LearningStats />

      <section className="space-y-4" aria-label="Course filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <CourseSearch value={query} onChange={setQuery} />
          </div>
          <CourseFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        </div>
      </section>

      {visibleCourses.length === 0 ? <LearningEmptyState /> : <CourseGrid courses={visibleCourses} />}
    </div>
  );
}
