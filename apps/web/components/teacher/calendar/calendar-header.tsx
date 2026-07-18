import { teacherCalendarPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function CalendarHeader({
  pageCopy,
}: {
  pageCopy?: {
    title?: string;
    description?: string;
  };
} = {}): React.JSX.Element {
  const copy = { ...teacherCalendarPageCopy, ...pageCopy };
  return <TeacherPageHeader title={copy.title} description={copy.description} />;
}
