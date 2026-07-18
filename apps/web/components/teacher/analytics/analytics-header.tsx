import { teacherAnalyticsPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function AnalyticsHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherAnalyticsPageCopy.title}
      description={teacherAnalyticsPageCopy.description}
    />
  );
}
