'use client';

import { teacherBatchesPageCopy, type TeacherBatchesViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function BatchViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherBatchesViewMode;
  onModeChange: (mode: TeacherBatchesViewMode) => void;
}): React.JSX.Element {
  const copy = teacherBatchesPageCopy;

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
