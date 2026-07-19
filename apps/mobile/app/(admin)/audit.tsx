import React from 'react';
import { AdminApi, type AuditLogRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function AdminAudit(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AuditLogRecord>
      title="Audit logs"
      subtitle="Security and administration activity"
      queryKey={['admin', 'audit', organizationId]}
      fetcher={() =>
        AdminApi.auditLogs({ organizationId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })
      }
      keyExtractor={(a) => a.id}
      emptyTitle="No audit events"
      renderItem={(log) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {log.action}
            </AppText>
            {log.entityType ? <Badge label={log.entityType} /> : null}
          </Row>
          <AppText variant="caption">{log.actorEmail ?? 'System'}</AppText>
          {log.createdAt ? (
            <AppText variant="caption">{new Date(log.createdAt).toLocaleString()}</AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
