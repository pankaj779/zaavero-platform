import {
  teacherLiveClasses,
  teacherLiveClassesViewState,
  type TeacherLiveClassDto,
  type TeacherLiveClassesViewState,
} from '../../../lib/teacher';
import { LiveClassesEmptyState } from './live-classes-empty-state';
import { LiveClassesErrorState } from './live-classes-error-state';
import { LiveClassesHeader } from './live-classes-header';
import { LiveClassesSkeleton } from './live-classes-skeleton';
import { LiveClassStats } from './live-class-stats';
import { LiveClassesWorkspace } from './live-classes-workspace';

/** Server-renderable module shell; interactivity is isolated in LiveClassesWorkspace. */
export function LiveClassesView({
  sessions = teacherLiveClasses,
  viewState = teacherLiveClassesViewState,
}: {
  sessions?: TeacherLiveClassDto[];
  viewState?: TeacherLiveClassesViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <LiveClassesHeader />
        <LiveClassesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <LiveClassesHeader />
        <LiveClassesErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || sessions.length === 0) {
    return (
      <div className="space-y-8">
        <LiveClassesHeader />
        <LiveClassesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LiveClassesHeader />
      <LiveClassStats sessions={sessions} />
      <LiveClassesWorkspace sessions={sessions} />
    </div>
  );
}
