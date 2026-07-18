'use client';

import { CalendarView } from '../../teacher/calendar';
import { studentCalendarPageCopy } from './copy';

/** Student Calendar route — reuses the live Teacher Calendar API workspace. */
export function StudentCalendarView(): React.JSX.Element {
  return <CalendarView portalMode="student" pageCopy={studentCalendarPageCopy} />;
}
