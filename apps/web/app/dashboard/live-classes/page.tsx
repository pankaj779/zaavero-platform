import { redirect } from 'next/navigation';
import { DASHBOARD_ROUTES } from '../../../lib/constants';

/** Legacy path — Live Classes now lives at /dashboard/live */
export default function LegacyLiveClassesRedirect(): never {
  redirect(DASHBOARD_ROUTES.liveClasses);
}
