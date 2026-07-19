import React from 'react';
import { AdminApi, type AdminUserRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function AdminUsers(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AdminUserRecord>
      title="Users"
      subtitle="All organization members"
      queryKey={['admin', 'users', organizationId]}
      fetcher={() => AdminApi.listUsers({ organizationId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })}
      keyExtractor={(u) => u.id}
      emptyTitle="No users"
      renderItem={(user) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {user.firstName} {user.lastName}
            </AppText>
            <Badge
              label={user.isActive === false ? 'Inactive' : 'Active'}
              tone={user.isActive === false ? 'danger' : 'success'}
            />
          </Row>
          <AppText variant="caption">{user.email}</AppText>
          <AppText variant="caption">{(user.roles ?? []).join(', ') || 'No roles'}</AppText>
        </Card>
      )}
    />
  );
}
