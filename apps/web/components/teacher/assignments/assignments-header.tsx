import { PageHeader } from '@graphology/ui';
import { teacherAssignmentsPageCopy } from '../../../lib/teacher';

export function AssignmentsHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherAssignmentsPageCopy.title}
      description={teacherAssignmentsPageCopy.description}
    />
  );
}
