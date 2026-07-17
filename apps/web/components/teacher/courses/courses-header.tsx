import { PageHeader } from '@graphology/ui';
import { teacherCoursesPageCopy } from '../../../lib/teacher';

export function CoursesHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherCoursesPageCopy.title}
      description={teacherCoursesPageCopy.description}
    />
  );
}
