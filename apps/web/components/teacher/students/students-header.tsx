import { PageHeader } from '@graphology/ui';
import { teacherStudentsPageCopy } from '../../../lib/teacher';

export function StudentsHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherStudentsPageCopy.title}
      description={teacherStudentsPageCopy.description}
    />
  );
}
