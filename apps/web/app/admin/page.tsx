import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '../../lib/constants';

/**
 * Admin area entry.
 */
export default function AdminRootPage(): never {
  redirect(ADMIN_ROUTES.dashboard);
}
