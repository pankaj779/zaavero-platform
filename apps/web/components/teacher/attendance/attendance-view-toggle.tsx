'use client';

import { teacherAttendancePageCopy, type TeacherAttendanceViewMode } from '../../../lib/teacher';
import { TeacherGridListToggle } from '../shared';

export function AttendanceViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherAttendanceViewMode;
  onModeChange: (mode: TeacherAttendanceViewMode) => void;
}): React.JSX.Element {
  const copy = teacherAttendancePageCopy;

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
