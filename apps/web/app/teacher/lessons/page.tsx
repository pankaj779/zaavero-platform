import { TeacherComingSoonPage } from '../../../components/teacher/shared';
import { TEACHER_ROUTES } from '../../../lib/constants';
import { getTeacherPageMeta } from '../../../lib/teacher';

const meta = getTeacherPageMeta(TEACHER_ROUTES.lessons);

export default function Page(): React.JSX.Element {
  return <TeacherComingSoonPage title={meta.title} description={meta.description} />;
}
