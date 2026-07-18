import { teacherCertificatesPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function CertificatesHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherCertificatesPageCopy.title}
      description={teacherCertificatesPageCopy.description}
    />
  );
}
