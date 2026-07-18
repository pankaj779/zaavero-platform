import { teacherBatchesPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function BatchesHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherBatchesPageCopy.title}
      description={teacherBatchesPageCopy.description}
    />
  );
}
