import React from 'react';
import { NotificationsApi, type NotificationRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function AdminNotifications(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<NotificationRecord>
      title="Notifications"
      subtitle="Organization alerts"
      queryKey={['admin', 'notifications', organizationId]}
      fetcher={() => NotificationsApi.list(organizationId)}
      keyExtractor={(n) => n.id}
      emptyTitle="No notifications"
      renderItem={(n) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {n.title}
            </AppText>
            {!n.read ? <Badge label="New" tone="primary" /> : null}
          </Row>
          {n.body ? (
            <AppText variant="caption" numberOfLines={2}>
              {n.body}
            </AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
