'use client';

import { teacherCoursesPageCopy, type TeacherCoursesViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

/**
 * Accessible grid/list toggle — a labelled group of pressed-state buttons.
 */
export function CourseViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherCoursesViewMode;
  onModeChange: (mode: TeacherCoursesViewMode) => void;
}): React.JSX.Element {
  const copy = teacherCoursesPageCopy;

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
