'use client';

import { teacherStudentsPageCopy, type TeacherStudentsViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function StudentViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherStudentsViewMode;
  onModeChange: (mode: TeacherStudentsViewMode) => void;
}): React.JSX.Element {
  const copy = teacherStudentsPageCopy;

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
