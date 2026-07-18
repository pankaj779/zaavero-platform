'use client';

import { Button } from '@graphology/ui';
import { useMemo, useState } from 'react';
import {
  buildTeacherCalendarMonth,
  filterTeacherCalendarEvents,
  getTeacherCalendarEventById,
  getTeacherCalendarEventsForDay,
  getTeacherCalendarTodayKey,
  shiftTeacherCalendarMonth,
  type TeacherCalendarEventDto,
  type TeacherCalendarEventFilter,
} from '../../../lib/teacher';
import { CalendarAgenda } from './calendar-agenda';
import { CalendarEmptyState } from './calendar-empty-state';
import { CalendarEventDetails } from './calendar-event-details';
import { CalendarFilters } from './calendar-filters';
import { CalendarGrid } from './calendar-grid';
import { CalendarLegend } from './calendar-legend';
import { CalendarSearch } from './calendar-search';
import { CalendarToolbar, type CalendarPortalMode } from './calendar-toolbar';
import { MiniCalendar } from './mini-calendar';

type CalendarDisplayMode = 'month' | 'week' | 'agenda';

/** Client boundary for month nav, day selection, search, and filters. */
export function CalendarWorkspace({
  events,
  query: controlledQuery,
  year: controlledYear,
  month: controlledMonth,
  selectedDate: controlledSelectedDate,
  onQueryChange,
  onMonthChange,
  onSelectedDateChange,
  onToday,
  serverFiltered = false,
  portalMode = 'teacher',
}: {
  events: TeacherCalendarEventDto[];
  query?: string;
  year?: number;
  month?: number;
  selectedDate?: string | null;
  onQueryChange?: (value: string) => void;
  onMonthChange?: (year: number, month: number) => void;
  onSelectedDateChange?: (date: string | null) => void;
  onToday?: () => void;
  /** When true, parent already applied search — only apply local type filters. */
  serverFiltered?: boolean;
  portalMode?: CalendarPortalMode;
}): React.JSX.Element {
  const [localQuery, setLocalQuery] = useState('');
  const [filter, setFilter] = useState<TeacherCalendarEventFilter>('all');
  const [localYear, setLocalYear] = useState(() => new Date().getUTCFullYear());
  const [localMonth, setLocalMonth] = useState(() => new Date().getUTCMonth() + 1);
  const [localSelectedDate, setLocalSelectedDate] = useState<string | null>(
    getTeacherCalendarTodayKey(),
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');

  const query = controlledQuery ?? localQuery;
  const year = controlledYear ?? localYear;
  const month = controlledMonth ?? localMonth;
  const selectedDate =
    controlledSelectedDate !== undefined ? controlledSelectedDate : localSelectedDate;

  const setQuery = onQueryChange ?? setLocalQuery;
  const setSelectedDate = onSelectedDateChange ?? setLocalSelectedDate;

  const filteredEvents = useMemo(() => {
    if (serverFiltered) {
      return filterTeacherCalendarEvents(events, '', filter);
    }
    return filterTeacherCalendarEvents(events, query, filter);
  }, [events, filter, query, serverFiltered]);

  const monthModel = useMemo(
    () => buildTeacherCalendarMonth(year, month, filteredEvents),
    [year, month, filteredEvents],
  );

  const agendaEvents = useMemo(
    () =>
      selectedDate === null ? [] : getTeacherCalendarEventsForDay(filteredEvents, selectedDate),
    [filteredEvents, selectedDate],
  );
  const monthAgendaEvents = useMemo(
    () =>
      [...filteredEvents].sort(
        (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
      ),
    [filteredEvents],
  );
  const weekDays = useMemo(() => {
    const selectedIndex = monthModel.days.findIndex((day) => day.date === selectedDate);
    const fallbackIndex = monthModel.days.findIndex((day) => day.isCurrentMonth);
    const anchorIndex = selectedIndex >= 0 ? selectedIndex : Math.max(fallbackIndex, 0);
    const weekStart = Math.floor(anchorIndex / 7) * 7;
    return monthModel.days.slice(weekStart, weekStart + 7);
  }, [monthModel.days, selectedDate]);

  const selectedEvent = useMemo(
    () => (selectedEventId === null ? null : getTeacherCalendarEventById(events, selectedEventId)),
    [events, selectedEventId],
  );

  const showNoMatches = filteredEvents.length === 0 && (query.trim() !== '' || filter !== 'all');

  const moveMonth = (delta: number) => {
    const next = shiftTeacherCalendarMonth(year, month, delta);
    if (onMonthChange) {
      onMonthChange(next.year, next.month);
    } else {
      setLocalYear(next.year);
      setLocalMonth(next.month);
    }
  };

  return (
    <div className="space-y-4">
      <CalendarToolbar
        monthLabel={monthModel.label}
        portalMode={portalMode}
        onPrevious={() => {
          moveMonth(-1);
        }}
        onNext={() => {
          moveMonth(1);
        }}
        onToday={() => {
          if (onToday) {
            onToday();
            return;
          }
          const now = new Date();
          setLocalYear(now.getUTCFullYear());
          setLocalMonth(now.getUTCMonth() + 1);
          setSelectedDate(getTeacherCalendarTodayKey());
        }}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Calendar view">
        {(['month', 'week', 'agenda'] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={displayMode === mode ? 'primary' : 'outline'}
            aria-pressed={displayMode === mode}
            onClick={() => {
              setDisplayMode(mode);
            }}
          >
            {mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'Agenda'}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 laptop:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,18rem)]">
        <aside
          className="order-2 flex min-w-0 flex-col gap-4 laptop:order-1"
          aria-label="Calendar sidebar"
        >
          <div className="hidden space-y-4 laptop:block">
            <MiniCalendar
              days={monthModel.days}
              selectedDate={selectedDate}
              onSelectDay={(date) => {
                setSelectedDate(date);
                setSelectedEventId(null);
              }}
            />
            <CalendarLegend />
            <CalendarSearch value={query} onChange={setQuery} />
            <CalendarFilters value={filter} onChange={setFilter} />
          </div>
          <div className="space-y-3 laptop:hidden">
            <CalendarSearch value={query} onChange={setQuery} />
            <CalendarFilters value={filter} onChange={setFilter} />
          </div>
        </aside>

        <section
          className="order-3 min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm tablet:p-5 laptop:order-2"
          aria-label="Monthly calendar"
        >
          {showNoMatches ? (
            <CalendarEmptyState variant="no-matches" />
          ) : displayMode === 'agenda' ? (
            <CalendarAgenda
              events={monthAgendaEvents}
              selectedEventId={selectedEventId}
              selectedDate={null}
              onSelectEvent={setSelectedEventId}
            />
          ) : (
            <CalendarGrid
              days={displayMode === 'week' ? weekDays : monthModel.days}
              events={filteredEvents}
              selectedDate={selectedDate}
              ariaLabel={displayMode === 'week' ? 'Weekly calendar' : undefined}
              onSelectDay={(date) => {
                setSelectedDate(date);
                setSelectedEventId(null);
              }}
            />
          )}
        </section>

        <aside
          className="order-1 flex min-w-0 flex-col gap-4 laptop:order-3"
          aria-label="Agenda and event details"
        >
          {displayMode === 'agenda' ? null : (
            <CalendarAgenda
              events={agendaEvents}
              selectedEventId={selectedEventId}
              selectedDate={selectedDate}
              onSelectEvent={setSelectedEventId}
            />
          )}
          {selectedEvent ? (
            <CalendarEventDetails
              event={selectedEvent}
              onClose={() => {
                setSelectedEventId(null);
              }}
            />
          ) : (
            <div className="hidden rounded-xl border border-dashed border-border bg-muted/20 p-5 laptop:block">
              <CalendarEmptyState variant="no-selection" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
