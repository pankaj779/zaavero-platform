import React from 'react';
import { AssignmentsApi, type AssignmentRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function StudentAssignments(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AssignmentRecord>
      title="Assignments"
      subtitle="Track upcoming and submitted work"
      queryKey={['student', 'assignments-list', organizationId]}
      fetcher={() =>
        AssignmentsApi.list({ organizationId, limit: 50, sortBy: 'dueAt', sortOrder: 'asc' })
      }
      keyExtractor={(a) => a.id}
      emptyTitle="No assignments"
      renderItem={(a) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {a.title}
            </AppText>
            {a.status ? <Badge label={a.status} /> : null}
          </Row>
          {a.dueAt ? (
            <AppText variant="caption">Due {new Date(a.dueAt).toLocaleDateString()}</AppText>
          ) : (
            <AppText variant="caption">No due date</AppText>
          )}
        </Card>
      )}
    />
  );
}
