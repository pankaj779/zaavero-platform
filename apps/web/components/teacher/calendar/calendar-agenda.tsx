import {
  teacherCalendarPageCopy,
  type TeacherCalendarEventDto,
} from '../../../lib/teacher';
import { CalendarEventCard } from './calendar-event-card';
import { CalendarEmptyState } from './calendar-empty-state';

export function CalendarAgenda({
  events,
  selectedEventId,
  selectedDate,
  onSelectEvent,
}: {
  events: TeacherCalendarEventDto[];
  selectedEventId: string | null;
  selectedDate: string | null;
  onSelectEvent: (eventId: string) => void;
}): React.JSX.Element {
  return (
    <section className="space-y-3" aria-label={teacherCalendarPageCopy.agendaLabel}>
      <h3 className="text-small font-semibold text-foreground">
        {selectedDate
          ? `${teacherCalendarPageCopy.agendaLabel} — ${selectedDate}`
          : teacherCalendarPageCopy.agendaLabel}
      </h3>
      {events.length === 0 ? (
        <CalendarEmptyState variant="no-day-events" />
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <CalendarEventCard
                event={event}
                selected={event.id === selectedEventId}
                onSelect={onSelectEvent}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
