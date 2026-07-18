'use client';

import { teacherLessonsPageCopy, type TeacherLessonsViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function LessonViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherLessonsViewMode;
  onModeChange: (mode: TeacherLessonsViewMode) => void;
}): React.JSX.Element {
  const copy = teacherLessonsPageCopy;

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
