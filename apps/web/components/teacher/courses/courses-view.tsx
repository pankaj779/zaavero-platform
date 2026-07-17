'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherCourses,
  sortTeacherCourses,
  teacherCourses,
  teacherCoursesViewState,
  type TeacherCourseSortOption,
  type TeacherCourseStatusFilter,
  type TeacherCourseSummaryDto,
  type TeacherCoursesViewMode,
  type TeacherCoursesViewState,
} from '../../../lib/teacher';
import { CourseCollection } from './course-collection';
import { CourseFilters } from './course-filters';
import { CourseSearch } from './course-search';
import { CourseStats } from './course-stats';
import { CourseViewToggle } from './course-view-toggle';
import { CoursesEmptyState } from './courses-empty-state';
import { CoursesErrorState } from './courses-error-state';
import { CoursesHeader } from './courses-header';
import { CoursesSkeleton } from './courses-skeleton';

export function CoursesView({
  courses = teacherCourses,
  viewState = teacherCoursesViewState,
}: {
  courses?: TeacherCourseSummaryDto[];
  viewState?: TeacherCoursesViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TeacherCourseStatusFilter>('all');
  const [sort, setSort] = useState<TeacherCourseSortOption>('newest');
  const [mode, setMode] = useState<TeacherCoursesViewMode>('grid');

  const visibleCourses = useMemo(() => {
    const filtered = filterTeacherCourses(courses, query, status);
    return sortTeacherCourses(filtered, sort);
  }, [courses, query, sort, status]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <CoursesHeader />
        <CoursesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <CoursesHeader />
        <CoursesErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || courses.length === 0) {
    return (
      <div className="space-y-8">
        <CoursesHeader />
        <CoursesEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CoursesHeader />

      <CourseStats courses={courses} />

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
          <div className="flex justify-end laptop:ml-auto">
            <CourseViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {visibleCourses.length === 0 ? (
        <CoursesEmptyState variant="no-matches" />
      ) : (
        <CourseCollection courses={visibleCourses} mode={mode} />
      )}
    </div>
  );
}
