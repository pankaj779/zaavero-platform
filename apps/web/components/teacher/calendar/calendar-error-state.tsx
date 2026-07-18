import { teacherCalendarPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function CalendarErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherCalendarPageCopy.errorTitle}
      description={teacherCalendarPageCopy.errorDescription}
    />
  );
}
