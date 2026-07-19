import { useAuth } from '../auth/auth-context';

/**
 * Returns the active organization id. Every list/detail query is scoped to this
 * organization, matching the backend's organization-based RBAC.
 */
export function useOrganizationId(): string {
  const { primaryOrganizationId } = useAuth();
  return primaryOrganizationId ?? '';
}
