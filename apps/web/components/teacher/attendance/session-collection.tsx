import {
  teacherAttendancePageCopy,
  type AttendanceSessionDto,
  type TeacherAttendanceViewMode,
} from '../../../lib/teacher';
import { SessionCard } from './session-card';

export function SessionCollection({
  sessions,
  mode,
  selectedSessionId,
  onSelect,
}: {
  sessions: AttendanceSessionDto[];
  mode: TeacherAttendanceViewMode;
  selectedSessionId?: string | null;
  onSelect?: (sessionId: string) => void;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherAttendancePageCopy.gridLabel}>
        {sessions.map((session) => (
          <li key={session.id}>
            <SessionCard
              session={session}
              layout="list"
              selected={session.id === selectedSessionId}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherAttendancePageCopy.gridLabel}
    >
      {sessions.map((session) => (
        <li key={session.id} className="h-full">
          <SessionCard
            session={session}
            layout="grid"
            selected={session.id === selectedSessionId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
