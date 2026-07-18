'use client';

import { Button } from '@graphology/ui';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { studentCoursesPageCopy } from './copy';

export function StudentCoursesErrorState({ onRetry }: { onRetry?: () => void }): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={studentCoursesPageCopy.errorTitle}
      description={studentCoursesPageCopy.errorDescription}
      retryLabel={studentCoursesPageCopy.retryLabel}
      onRetry={onRetry}
    />
  );
}

export function StudentCoursesEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  if (variant === 'no-matches') {
    return (
      <TeacherModuleEmptyState
        title={studentCoursesPageCopy.noMatchesTitle}
        description={studentCoursesPageCopy.noMatchesDescription}
        icon="search"
      />
    );
  }

  return (
    <TeacherModuleEmptyState
      title={studentCoursesPageCopy.emptyTitle}
      description={studentCoursesPageCopy.emptyDescription}
      icon="book"
    />
  );
}

export function StudentCoursesPagination({
  page,
  totalPages,
  total,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}): React.JSX.Element {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div
      className="flex flex-col gap-3 border-t border-border pt-4 tablet:flex-row tablet:items-center tablet:justify-between"
      aria-label="Course pagination"
    >
      <p className="text-caption text-muted-foreground">
        {studentCoursesPageCopy.pageLabel} {page} {studentCoursesPageCopy.ofLabel} {safeTotalPages}{' '}
        · {total} courses
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={onPrevious}>
          {studentCoursesPageCopy.previousLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= safeTotalPages}
          onClick={onNext}
        >
          {studentCoursesPageCopy.nextLabel}
        </Button>
      </div>
    </div>
  );
}
