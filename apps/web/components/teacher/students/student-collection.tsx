import {
  teacherStudentsPageCopy,
  type TeacherStudentSummaryDto,
  type TeacherStudentsViewMode,
} from '../../../lib/teacher';
import { StudentCard } from './student-card';

export function StudentCollection({
  students,
  mode,
}: {
  students: TeacherStudentSummaryDto[];
  mode: TeacherStudentsViewMode;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherStudentsPageCopy.gridLabel}>
        {students.map((student) => (
          <li key={student.id}>
            <StudentCard student={student} layout="list" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherStudentsPageCopy.gridLabel}
    >
      {students.map((student) => (
        <li key={student.id} className="h-full">
          <StudentCard student={student} layout="grid" />
        </li>
      ))}
    </ul>
  );
}
