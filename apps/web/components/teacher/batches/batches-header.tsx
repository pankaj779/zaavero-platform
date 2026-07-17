import { PageHeader } from '@graphology/ui';
import { teacherBatchesPageCopy } from '../../../lib/teacher';

export function BatchesHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherBatchesPageCopy.title}
      description={teacherBatchesPageCopy.description}
    />
  );
}
