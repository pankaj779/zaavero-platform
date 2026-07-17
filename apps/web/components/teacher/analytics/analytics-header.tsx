import { PageHeader } from '@graphology/ui';
import { teacherAnalyticsPageCopy } from '../../../lib/teacher';

export function AnalyticsHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherAnalyticsPageCopy.title}
      description={teacherAnalyticsPageCopy.description}
    />
  );
}
