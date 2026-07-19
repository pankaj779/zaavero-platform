import React from 'react';
import { AdminApi, type AdminUserRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function AdminStudents(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AdminUserRecord>
      title="Students"
      subtitle="Users with the Student role"
      queryKey={['admin', 'students', organizationId]}
      fetcher={() => AdminApi.listUsers({ organizationId, limit: 50, role: 'Student' })}
      keyExtractor={(u) => u.id}
      emptyTitle="No students"
      renderItem={(user) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {user.firstName} {user.lastName}
            </AppText>
            <Badge label="Student" tone="success" />
          </Row>
          <AppText variant="caption">{user.email}</AppText>
        </Card>
      )}
    />
  );
}
