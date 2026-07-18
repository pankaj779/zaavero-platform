'use client';

import { teacherSubmissionsPageCopy, type TeacherSubmissionsViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function SubmissionViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherSubmissionsViewMode;
  onModeChange: (mode: TeacherSubmissionsViewMode) => void;
}): React.JSX.Element {
  const copy = teacherSubmissionsPageCopy;

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
