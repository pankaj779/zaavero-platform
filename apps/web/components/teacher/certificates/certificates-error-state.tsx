import { teacherCertificatesPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function CertificatesErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherCertificatesPageCopy.errorTitle}
      description={teacherCertificatesPageCopy.errorDescription}
    />
  );
}
