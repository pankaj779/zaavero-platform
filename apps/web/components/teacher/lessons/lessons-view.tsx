'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CourseApi, LessonApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  getTeacherLessonById,
  toLessonApiContentType,
  toLessonListSort,
  type TeacherLessonContentTypeFilter,
  type TeacherLessonSortOption,
  type TeacherLessonSummaryDto,
  type TeacherLessonsViewMode,
  type TeacherLessonsViewState,
} from '../../../lib/teacher';
import { LessonCollection } from './lesson-collection';
import { LessonDetailsPanel } from './lesson-details-panel';
import { LessonFilters } from './lesson-filters';
import { LessonSearch } from './lesson-search';
import { LessonStats } from './lesson-stats';
import { LessonViewToggle } from './lesson-view-toggle';
import { LessonsEmptyState } from './lessons-empty-state';
import { LessonsErrorState } from './lessons-error-state';
import { LessonsHeader } from './lessons-header';
import { LessonsSkeleton } from './lessons-skeleton';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function LessonsView({
  initialLessons,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialLessons?: TeacherLessonSummaryDto[];
  initialViewState?: TeacherLessonsViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [contentType, setContentType] = useState<TeacherLessonContentTypeFilter>('all');
  const [courseId, setCourseId] = useState<string>('all');
  const [sort, setSort] = useState<TeacherLessonSortOption>('display_order');
  const [mode, setMode] = useState<TeacherLessonsViewMode>('grid');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
  ]);

  const [viewState, setViewState] = useState<TeacherLessonsViewState>(
    initialViewState ?? 'loading',
  );
  const [lessons, setLessons] = useState<TeacherLessonSummaryDto[]>(initialLessons ?? []);
  const [statsLessons, setStatsLessons] = useState<TeacherLessonSummaryDto[]>(initialLessons ?? []);
  const hasLoadedRef = useRef(initialViewState !== undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (initialViewState !== undefined && initialLessons !== undefined) {
      return;
    }

    void (async () => {
      try {
        const result = await CourseApi.getCourses({
          organizationId: primaryOrganizationId ?? undefined,
          page: 1,
          limit: LIST_LIMIT,
          sortBy: 'title',
          sortOrder: 'asc',
        });
        setCourseOptions([
          { value: 'all', label: 'All Courses' },
          ...result.items.map((course) => ({
            value: course.id,
            label: course.title,
          })),
        ]);
      } catch {
        setCourseOptions([{ value: 'all', label: 'All Courses' }]);
      }
    })();
  }, [initialLessons, initialViewState, primaryOrganizationId]);

  const loadStats = useCallback(
    async (signal: AbortSignal) => {
      const result = await LessonApi.getLessons({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
        enrichCourse: false,
      });
      if (signal.aborted) {
        return;
      }
      setStatsLessons(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toLessonListSort(sort);
      const result = await LessonApi.getLessons({
        organizationId: primaryOrganizationId ?? undefined,
        search: debouncedQuery || undefined,
        contentType: toLessonApiContentType(contentType),
        courseId: courseId === 'all' ? undefined : courseId,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      setLessons(result.items);

      const filtersActive =
        debouncedQuery.trim().length > 0 || contentType !== 'all' || courseId !== 'all';
      if (result.items.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [contentType, courseId, debouncedQuery, primaryOrganizationId, sort],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialLessons !== undefined) {
      return;
    }

    const controller = new AbortController();
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setViewState('loading');
    }

    void (async () => {
      try {
        if (isFirstLoad) {
          await Promise.all([loadStats(controller.signal), loadList(controller.signal)]);
        } else {
          await loadList(controller.signal);
        }
        hasLoadedRef.current = true;
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialLessons, initialViewState, loadList, loadStats]);

  const selectedLesson = useMemo(
    () => (selectedLessonId === null ? null : getTeacherLessonById(lessons, selectedLessonId)),
    [lessons, selectedLessonId],
  );

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <LessonsHeader />
        <LessonsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <LessonsHeader />
        <LessonsErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <LessonsHeader />
        <LessonsEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LessonsHeader />

      <LessonStats lessons={statsLessons} />

      <section className="space-y-4" aria-label="Lesson filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <LessonSearch value={query} onChange={setQuery} />
          </div>
          <LessonFilters
            contentType={contentType}
            courseId={courseId}
            courseOptions={courseOptions}
            sort={sort}
            onContentTypeChange={setContentType}
            onCourseChange={setCourseId}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <LessonViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {selectedLesson ? (
        <LessonDetailsPanel
          lesson={selectedLesson}
          onClose={() => {
            setSelectedLessonId(null);
          }}
        />
      ) : null}

      {lessons.length === 0 ? (
        <LessonsEmptyState variant="no-matches" />
      ) : (
        <LessonCollection
          lessons={lessons}
          mode={mode}
          selectedLessonId={selectedLessonId}
          onSelect={setSelectedLessonId}
        />
      )}
    </div>
  );
}
