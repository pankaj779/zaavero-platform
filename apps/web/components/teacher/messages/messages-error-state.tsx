import { teacherMessagesPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function MessagesErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherMessagesPageCopy.errorTitle}
      description={teacherMessagesPageCopy.errorDescription}
    />
  );
}
