import { teacherCalendarPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function CalendarEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches' | 'no-day-events' | 'no-selection';
}): React.JSX.Element {
  const copy = teacherCalendarPageCopy;

  const title =
    variant === 'no-matches'
      ? copy.noMatchesTitle
      : variant === 'no-day-events'
        ? copy.noDayEventsTitle
        : variant === 'no-selection'
          ? copy.noSelectionTitle
          : copy.emptyTitle;

  const description =
    variant === 'no-matches'
      ? copy.noMatchesDescription
      : variant === 'no-day-events'
        ? copy.noDayEventsDescription
        : variant === 'no-selection'
          ? copy.noSelectionDescription
          : copy.emptyDescription;

  return <TeacherModuleEmptyState title={title} description={description} icon="calendar" />;
}
