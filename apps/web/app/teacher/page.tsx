import { redirect } from 'next/navigation';
import { TEACHER_ROUTES } from '../../lib/constants';

export default function TeacherRootPage(): never {
  redirect(TEACHER_ROUTES.dashboard);
}
