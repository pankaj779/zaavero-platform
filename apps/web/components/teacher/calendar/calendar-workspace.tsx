'use client';

import { useMemo, useState } from 'react';
import {
  buildTeacherCalendarMonth,
  filterTeacherCalendarEvents,
  getTeacherCalendarEventById,
  getTeacherCalendarEventsForDay,
  shiftTeacherCalendarMonth,
  teacherCalendarInitialMonth,
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
import { CalendarToolbar } from './calendar-toolbar';
import { MiniCalendar } from './mini-calendar';

/** Client boundary for month nav, day selection, search, and filters. */
export function CalendarWorkspace({
  events,
}: {
  events: TeacherCalendarEventDto[];
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TeacherCalendarEventFilter>('all');
  const [year, setYear] = useState<number>(teacherCalendarInitialMonth.year);
  const [month, setMonth] = useState<number>(teacherCalendarInitialMonth.month);
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-07-17');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const filteredEvents = useMemo(
    () => filterTeacherCalendarEvents(events, query, filter),
    [events, query, filter],
  );

  const monthModel = useMemo(
    () => buildTeacherCalendarMonth(year, month, filteredEvents),
    [year, month, filteredEvents],
  );

  const agendaEvents = useMemo(
    () =>
      selectedDate === null
        ? []
        : getTeacherCalendarEventsForDay(filteredEvents, selectedDate),
    [filteredEvents, selectedDate],
  );

  const selectedEvent = useMemo(
    () =>
      selectedEventId === null
        ? null
        : getTeacherCalendarEventById(events, selectedEventId),
    [events, selectedEventId],
  );

  const showNoMatches = filteredEvents.length === 0 && (query.trim() !== '' || filter !== 'all');

  return (
    <div className="space-y-4">
      <CalendarToolbar
        monthLabel={monthModel.label}
        onPrevious={() => {
          const next = shiftTeacherCalendarMonth(year, month, -1);
          setYear(next.year);
          setMonth(next.month);
        }}
        onNext={() => {
          const next = shiftTeacherCalendarMonth(year, month, 1);
          setYear(next.year);
          setMonth(next.month);
        }}
        onToday={() => {
          setYear(teacherCalendarInitialMonth.year);
          setMonth(teacherCalendarInitialMonth.month);
          setSelectedDate('2026-07-17');
        }}
      />

      <div className="grid gap-4 laptop:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,18rem)]">
        <aside className="order-2 flex min-w-0 flex-col gap-4 laptop:order-1" aria-label="Calendar sidebar">
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
          ) : (
            <CalendarGrid
              days={monthModel.days}
              events={filteredEvents}
              selectedDate={selectedDate}
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
          <CalendarAgenda
            events={agendaEvents}
            selectedEventId={selectedEventId}
            selectedDate={selectedDate}
            onSelectEvent={setSelectedEventId}
          />
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
