import {
  teacherAssignmentsPageCopy,
  type TeacherAssignmentDto,
  type TeacherAssignmentsViewMode,
} from '../../../lib/teacher';
import { AssignmentCard } from './assignment-card';

export function AssignmentCollection({
  assignments,
  mode,
  selectedAssignmentId,
  onSelect,
}: {
  assignments: TeacherAssignmentDto[];
  mode: TeacherAssignmentsViewMode;
  selectedAssignmentId?: string | null;
  onSelect?: (assignmentId: string) => void;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherAssignmentsPageCopy.collectionLabel}>
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <AssignmentCard
              assignment={assignment}
              layout="list"
              selected={assignment.id === selectedAssignmentId}
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
      aria-label={teacherAssignmentsPageCopy.collectionLabel}
    >
      {assignments.map((assignment) => (
        <li key={assignment.id} className="h-full">
          <AssignmentCard
            assignment={assignment}
            selected={assignment.id === selectedAssignmentId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
