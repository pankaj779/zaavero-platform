import { Button } from '@graphology/ui';
import {
  teacherAssignments,
  teacherAssignmentsPageCopy,
  teacherAssignmentsViewState,
  type TeacherAssignmentDto,
  type TeacherAssignmentsViewState,
} from '../../../lib/teacher';
import { AssignmentStats } from './assignment-stats';
import { AssignmentsEmptyState } from './assignments-empty-state';
import { AssignmentsErrorState } from './assignments-error-state';
import { AssignmentsHeader } from './assignments-header';
import { AssignmentsSkeleton } from './assignments-skeleton';
import { AssignmentsWorkspace } from './assignments-workspace';

function CreateAssignmentAction(): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" disabled aria-label={`${copy.createButton} — coming soon`}>
        {copy.createButton}
      </Button>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

/** Server-renderable module shell; interactivity is isolated in AssignmentsWorkspace. */
export function AssignmentsView({
  assignments = teacherAssignments,
  viewState = teacherAssignmentsViewState,
}: {
  assignments?: TeacherAssignmentDto[];
  viewState?: TeacherAssignmentsViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || assignments.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start laptop:justify-between">
          <AssignmentsHeader />
          <CreateAssignmentAction />
        </div>
        <AssignmentsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start laptop:justify-between">
        <AssignmentsHeader />
        <CreateAssignmentAction />
      </div>
      <AssignmentStats assignments={assignments} />
      <AssignmentsWorkspace assignments={assignments} />
    </div>
  );
}
