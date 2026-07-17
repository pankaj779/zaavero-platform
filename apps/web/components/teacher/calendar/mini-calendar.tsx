import {
  teacherCalendarPageCopy,
  type TeacherCalendarDayDto,
} from '../../../lib/teacher';
import { CalendarDay } from './calendar-day';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MiniCalendar({
  days,
  selectedDate,
  onSelectDay,
}: {
  days: TeacherCalendarDayDto[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}): React.JSX.Element {
  return (
    <section className="space-y-2" aria-label={teacherCalendarPageCopy.miniCalendarLabel}>
      <h3 className="text-small font-semibold text-foreground">
        {teacherCalendarPageCopy.miniCalendarLabel}
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={`${weekday}-${String(index)}`}
            className="text-center text-[10px] font-medium text-muted-foreground"
          >
            {weekday}
          </div>
        ))}
        {days.map((day) => (
          <CalendarDay
            key={`mini-${day.date}`}
            day={day}
            selected={day.date === selectedDate}
            eventCount={day.eventIds.length}
            onSelect={onSelectDay}
            compact
          />
        ))}
      </div>
    </section>
  );
}
