import { cn } from '@graphology/utils';
import type { TeacherCalendarDayDto } from '../../../lib/teacher';

export function CalendarDay({
  day,
  selected = false,
  eventCount,
  onSelect,
  compact = false,
}: {
  day: TeacherCalendarDayDto;
  selected?: boolean;
  eventCount: number;
  onSelect?: (date: string) => void;
  compact?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${day.date}${eventCount > 0 ? `, ${String(eventCount)} events` : ''}`}
      disabled={!day.isCurrentMonth}
      className={cn(
        'flex flex-col items-start gap-1 rounded-lg border border-border text-left transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'min-h-8 p-1' : 'min-h-16 p-2',
        day.isCurrentMonth ? 'bg-card hover:bg-muted/40' : 'bg-muted/20 text-muted-foreground',
        day.isToday ? 'border-primary' : '',
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
      onClick={() => {
        if (day.isCurrentMonth) {
          onSelect?.(day.date);
        }
      }}
    >
      <span
        className={cn(
          'font-semibold text-foreground',
          compact ? 'text-[10px]' : 'text-small',
        )}
      >
        {day.dayOfMonth}
      </span>
      {!compact && eventCount > 0 ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {String(eventCount)}
        </span>
      ) : null}
      {compact && eventCount > 0 ? (
        <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}
