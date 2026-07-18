import { teacherLiveClassesPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function LiveClassesHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherLiveClassesPageCopy.title}
      description={teacherLiveClassesPageCopy.description}
    />
  );
}
