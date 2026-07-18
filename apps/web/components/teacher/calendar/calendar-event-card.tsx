import { Badge, Button, Card, CardContent } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherCalendarDateTime,
  teacherCalendarEventTypeLabel,
  type TeacherCalendarEventDto,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';

const typeVariant: Record<
  TeacherCalendarEventDto['type'],
  'primary' | 'warning' | 'success' | 'neutral' | 'secondary'
> = {
  live_class: 'primary',
  assignment_due: 'warning',
  office_hours: 'success',
  holiday: 'neutral',
  reminder: 'secondary',
};

export function CalendarEventCard({
  event,
  selected = false,
  onSelect,
}: {
  event: TeacherCalendarEventDto;
  selected?: boolean;
  onSelect?: (eventId: string) => void;
}): React.JSX.Element {
  return (
    <Card
      className={cn(teacherCardSurfaceClass, selected ? 'ring-2 ring-primary ring-offset-2' : '')}
    >
      <CardContent className="p-4">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start whitespace-normal p-0 text-left hover:bg-transparent"
          aria-pressed={selected}
          aria-label={`Open event ${event.title}`}
          onClick={() => {
            onSelect?.(event.id);
          }}
        >
          <span className="flex w-full flex-col gap-2">
            <Badge variant={typeVariant[event.type]}>
              {teacherCalendarEventTypeLabel[event.type]}
            </Badge>
            <span className="text-small font-semibold text-foreground">{event.title}</span>
            <span className="text-caption text-muted-foreground">
              {formatTeacherCalendarDateTime(event.startTime)}
            </span>
            {event.course ? (
              <span className="text-caption text-muted-foreground">{event.course.title}</span>
            ) : null}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
