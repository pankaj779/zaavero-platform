import { PageHeader } from '@graphology/ui';
import { teacherLiveClassesPageCopy } from '../../../lib/teacher';

export function LiveClassesHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherLiveClassesPageCopy.title}
      description={teacherLiveClassesPageCopy.description}
    />
  );
}
