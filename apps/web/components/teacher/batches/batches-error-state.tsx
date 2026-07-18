import { teacherBatchesPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function BatchesErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherBatchesPageCopy.errorTitle}
      description={teacherBatchesPageCopy.errorDescription}
    />
  );
}
