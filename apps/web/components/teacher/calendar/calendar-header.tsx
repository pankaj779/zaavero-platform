import { PageHeader } from '@graphology/ui';
import { teacherCalendarPageCopy } from '../../../lib/teacher';

export function CalendarHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherCalendarPageCopy.title}
      description={teacherCalendarPageCopy.description}
    />
  );
}
