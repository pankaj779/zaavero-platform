'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherStudents,
  sortTeacherStudents,
  teacherStudents,
  teacherStudentsViewState,
  type TeacherStudentSortOption,
  type TeacherStudentStatusFilter,
  type TeacherStudentSummaryDto,
  type TeacherStudentsViewMode,
  type TeacherStudentsViewState,
} from '../../../lib/teacher';
import { StudentCollection } from './student-collection';
import { StudentFilters } from './student-filters';
import { StudentSearch } from './student-search';
import { StudentStats } from './student-stats';
import { StudentViewToggle } from './student-view-toggle';
import { StudentsEmptyState } from './students-empty-state';
import { StudentsErrorState } from './students-error-state';
import { StudentsHeader } from './students-header';
import { StudentsSkeleton } from './students-skeleton';

export function StudentsView({
  students = teacherStudents,
  viewState = teacherStudentsViewState,
}: {
  students?: TeacherStudentSummaryDto[];
  viewState?: TeacherStudentsViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TeacherStudentStatusFilter>('all');
  const [sort, setSort] = useState<TeacherStudentSortOption>('name');
  const [mode, setMode] = useState<TeacherStudentsViewMode>('grid');

  const visibleStudents = useMemo(() => {
    const filtered = filterTeacherStudents(students, query, status);
    return sortTeacherStudents(filtered, sort);
  }, [students, query, sort, status]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentsHeader />
        <StudentsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <StudentsHeader />
        <StudentsErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || students.length === 0) {
    return (
      <div className="space-y-8">
        <StudentsHeader />
        <StudentsEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentsHeader />

      <StudentStats students={students} />

      <section className="space-y-4" aria-label="Student filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <StudentSearch value={query} onChange={setQuery} />
          </div>
          <StudentFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <StudentViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {visibleStudents.length === 0 ? (
        <StudentsEmptyState variant="no-matches" />
      ) : (
        <StudentCollection students={visibleStudents} mode={mode} />
      )}
    </div>
  );
}
