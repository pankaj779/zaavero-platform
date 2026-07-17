import {
  teacherLiveClassesPageCopy,
  type TeacherLiveClassDto,
  type TeacherLiveClassesViewMode,
} from '../../../lib/teacher';
import { LiveClassCard } from './live-class-card';

export function LiveClassCollection({
  sessions,
  mode,
  selectedSessionId,
  onSelect,
}: {
  sessions: TeacherLiveClassDto[];
  mode: TeacherLiveClassesViewMode;
  selectedSessionId?: string | null;
  onSelect?: (sessionId: string) => void;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherLiveClassesPageCopy.collectionLabel}>
        {sessions.map((session) => (
          <li key={session.id}>
            <LiveClassCard
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
      aria-label={teacherLiveClassesPageCopy.collectionLabel}
    >
      {sessions.map((session) => (
        <li key={session.id} className="h-full">
          <LiveClassCard
            session={session}
            selected={session.id === selectedSessionId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
