import { PageHeader } from '@graphology/ui';
import { assignmentsPageCopy } from '../../../lib/dashboard';

export function AssignmentsHeader(): React.JSX.Element {
  return (
    <PageHeader title={assignmentsPageCopy.title} description={assignmentsPageCopy.description} />
  );
}
