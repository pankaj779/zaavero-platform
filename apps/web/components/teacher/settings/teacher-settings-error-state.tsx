import { teacherSettingsPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function TeacherSettingsErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherSettingsPageCopy.errorTitle}
      description={teacherSettingsPageCopy.errorDescription}
    />
  );
}
