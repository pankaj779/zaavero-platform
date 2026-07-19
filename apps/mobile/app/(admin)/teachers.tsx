import React from 'react';
import { AdminApi, type AdminUserRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function AdminTeachers(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AdminUserRecord>
      title="Teachers"
      subtitle="Users with the Teacher role"
      queryKey={['admin', 'teachers', organizationId]}
      fetcher={() => AdminApi.listUsers({ organizationId, limit: 50, role: 'Teacher' })}
      keyExtractor={(u) => u.id}
      emptyTitle="No teachers"
      renderItem={(user) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {user.firstName} {user.lastName}
            </AppText>
            <Badge label="Teacher" tone="primary" />
          </Row>
          <AppText variant="caption">{user.email}</AppText>
        </Card>
      )}
    />
  );
}
