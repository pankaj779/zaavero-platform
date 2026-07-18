import { teacherSettingsPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function TeacherSettingsHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherSettingsPageCopy.title}
      description={teacherSettingsPageCopy.description}
    />
  );
}
