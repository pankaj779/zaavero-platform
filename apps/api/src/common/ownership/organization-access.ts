import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import { OrganizationAccessDeniedException } from '../exceptions/organization-access-denied.exception';

export function assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
  if (!user.organizationIds.includes(organizationId)) {
    throw new OrganizationAccessDeniedException();
  }
}

export function resolveOrganizationId(user: AuthenticatedUser, organizationId?: string): string {
  if (organizationId) {
    assertOrganizationAccess(user, organizationId);
    return organizationId;
  }

  if (user.organizationIds.length === 1) {
    const [onlyOrganizationId] = user.organizationIds;
    if (onlyOrganizationId) {
      return onlyOrganizationId;
    }
  }

  throw new OrganizationAccessDeniedException(
    'organizationId is required when you belong to multiple organizations.',
  );
}
