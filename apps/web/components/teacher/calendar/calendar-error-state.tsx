import { teacherCalendarPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function CalendarErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherCalendarPageCopy.errorTitle}
      description={teacherCalendarPageCopy.errorDescription}
    />
  );
}
