import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { OrganizationAccessDeniedException } from '../exceptions';

export function assertAIOrganizationAccess(
  user: AuthenticatedUser,
  organizationId: string,
): void {
  if (!user.organizationIds.includes(organizationId)) {
    throw new OrganizationAccessDeniedException();
  }
}
