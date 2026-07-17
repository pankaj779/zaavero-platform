import { Badge } from '@graphology/ui';
import {
  teacherCalendarEventTypeLabel,
  teacherCalendarPageCopy,
  type TeacherCalendarEventType,
} from '../../../lib/teacher';

const legendTypes: TeacherCalendarEventType[] = [
  'live_class',
  'assignment_due',
  'office_hours',
  'holiday',
  'reminder',
];

const typeVariant: Record<
  TeacherCalendarEventType,
  'primary' | 'warning' | 'success' | 'neutral' | 'secondary'
> = {
  live_class: 'primary',
  assignment_due: 'warning',
  office_hours: 'success',
  holiday: 'neutral',
  reminder: 'secondary',
};

export function CalendarLegend(): React.JSX.Element {
  return (
    <section className="space-y-3" aria-label={teacherCalendarPageCopy.legendLabel}>
      <h3 className="text-small font-semibold text-foreground">
        {teacherCalendarPageCopy.legendLabel}
      </h3>
      <ul className="flex flex-col gap-2">
        {legendTypes.map((type) => (
          <li key={type}>
            <Badge variant={typeVariant[type]}>{teacherCalendarEventTypeLabel[type]}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
