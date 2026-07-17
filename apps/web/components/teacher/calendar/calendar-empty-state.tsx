import { icons } from '../../../lib/constants';
import { teacherCalendarPageCopy } from '../../../lib/teacher';
import { DashboardEmptyState } from '../../dashboard/shared';

const CalendarIcon = icons.calendar;

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

  return (
    <DashboardEmptyState
      title={title}
      description={description}
      illustration={<CalendarIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
