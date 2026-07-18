import { PageHeader } from '@graphology/ui';
import { studentProfileCopy } from './copy';

export function StudentProfileHeader(): React.JSX.Element {
  return (
    <PageHeader title={studentProfileCopy.title} description={studentProfileCopy.description} />
  );
}
