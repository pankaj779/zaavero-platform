'use client';

import { teacherAssignmentsPageCopy, type TeacherAssignmentsViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function AssignmentViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherAssignmentsViewMode;
  onModeChange: (mode: TeacherAssignmentsViewMode) => void;
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;

  return (
    <TeacherGridListToggle
      mode={mode}
      onModeChange={onModeChange}
      viewModeLabel={copy.viewModeLabel}
      gridViewLabel={copy.gridViewLabel}
      listViewLabel={copy.listViewLabel}
    />
  );
}
