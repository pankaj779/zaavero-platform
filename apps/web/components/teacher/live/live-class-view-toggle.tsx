'use client';

import { teacherLiveClassesPageCopy, type TeacherLiveClassesViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function LiveClassViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherLiveClassesViewMode;
  onModeChange: (mode: TeacherLiveClassesViewMode) => void;
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;

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
