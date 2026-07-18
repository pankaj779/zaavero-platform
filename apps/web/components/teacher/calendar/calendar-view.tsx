'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  filterTeacherCalendarEvents,
  getTeacherCalendarInitialMonth,
  getTeacherCalendarMonthRange,
  getTeacherCalendarTodayKey,
  toCalendarListSort,
  type TeacherCalendarEventDto,
  type TeacherCalendarViewState,
} from '../../../lib/teacher';
import { CalendarEmptyState } from './calendar-empty-state';
import { CalendarErrorState } from './calendar-error-state';
import { CalendarHeader } from './calendar-header';
import { CalendarSkeleton } from './calendar-skeleton';
import { type CalendarPortalMode } from './calendar-toolbar';
import { CalendarWorkspace } from './calendar-workspace';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

/** Client calendar shell; loads NestJS calendar events for the visible month. */
export function CalendarView({
  initialEvents,
  initialViewState,
  portalMode = 'teacher',
  pageCopy,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialEvents?: TeacherCalendarEventDto[];
  initialViewState?: TeacherCalendarViewState;
  portalMode?: CalendarPortalMode;
  pageCopy?: {
    title?: string;
    description?: string;
  };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const initialMonth = getTeacherCalendarInitialMonth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [year, setYear] = useState(initialMonth.year);
  const [month, setMonth] = useState(initialMonth.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(getTeacherCalendarTodayKey());

  const [viewState, setViewState] = useState<TeacherCalendarViewState>(
    initialViewState ?? 'loading',
  );
  const [events, setEvents] = useState<TeacherCalendarEventDto[]>(initialEvents ?? []);
  const hasLoadedRef = useRef(initialViewState !== undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { from, to } = getTeacherCalendarMonthRange(year, month);
      const { sortBy, sortOrder } = toCalendarListSort();

      // Backend search matches title only. Course/batch search finishes client-side.
      const result = await CalendarApi.getCalendarEvents({
        organizationId: primaryOrganizationId ?? undefined,
        from,
        to,
        search: debouncedQuery.trim() || undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      // Finish broad search after enrichment; type filter stays in the workspace.
      const filtered = filterTeacherCalendarEvents(result.items, debouncedQuery, 'all');
      setEvents(filtered);

      const filtersActive = debouncedQuery.trim().length > 0;
      if (filtered.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [debouncedQuery, month, primaryOrganizationId, year],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialEvents !== undefined) {
      return;
    }

    const controller = new AbortController();
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setViewState('loading');
    }

    void (async () => {
      try {
        await loadList(controller.signal);
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
  }, [initialEvents, initialViewState, loadList]);

  const header = <CalendarHeader pageCopy={pageCopy} />;

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        {header}
        <CalendarSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        {header}
        <CalendarErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        {header}
        <CalendarEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}
      <CalendarWorkspace
        events={events}
        query={query}
        year={year}
        month={month}
        selectedDate={selectedDate}
        portalMode={portalMode}
        onQueryChange={setQuery}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
        onSelectedDateChange={setSelectedDate}
        onToday={() => {
          const today = getTeacherCalendarInitialMonth();
          setYear(today.year);
          setMonth(today.month);
          setSelectedDate(getTeacherCalendarTodayKey());
        }}
        serverFiltered
      />
    </div>
  );
}
