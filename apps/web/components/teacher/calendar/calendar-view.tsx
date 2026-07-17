import {
  teacherCalendarEvents,
  teacherCalendarViewState,
  type TeacherCalendarEventDto,
  type TeacherCalendarViewState,
} from '../../../lib/teacher';
import { CalendarEmptyState } from './calendar-empty-state';
import { CalendarErrorState } from './calendar-error-state';
import { CalendarHeader } from './calendar-header';
import { CalendarSkeleton } from './calendar-skeleton';
import { CalendarWorkspace } from './calendar-workspace';

/** Server-renderable calendar shell; interactivity lives in CalendarWorkspace. */
export function CalendarView({
  events = teacherCalendarEvents,
  viewState = teacherCalendarViewState,
}: {
  events?: TeacherCalendarEventDto[];
  viewState?: TeacherCalendarViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <CalendarHeader />
        <CalendarSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <CalendarHeader />
        <CalendarErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || events.length === 0) {
    return (
      <div className="space-y-8">
        <CalendarHeader />
        <CalendarEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CalendarHeader />
      <CalendarWorkspace events={events} />
    </div>
  );
}
