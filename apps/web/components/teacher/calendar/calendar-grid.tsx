import {
  teacherCalendarPageCopy,
  type TeacherCalendarDayDto,
  type TeacherCalendarEventDto,
} from '../../../lib/teacher';
import { CalendarDay } from './calendar-day';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  days,
  events,
  selectedDate,
  onSelectDay,
}: {
  days: TeacherCalendarDayDto[];
  events: TeacherCalendarEventDto[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}): React.JSX.Element {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = event.startTime.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <section className="space-y-3" aria-label={teacherCalendarPageCopy.monthGridLabel}>
      <div className="grid grid-cols-7 gap-2" role="row">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="text-center text-caption font-medium text-muted-foreground"
            role="columnheader"
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2" role="grid" aria-label={teacherCalendarPageCopy.monthGridLabel}>
        {days.map((day) => (
          <CalendarDay
            key={day.date}
            day={day}
            selected={day.date === selectedDate}
            eventCount={counts.get(day.date) ?? 0}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </section>
  );
}
