import React from 'react';
import { CalendarApi, type CalendarEventRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function StudentCalendar(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<CalendarEventRecord>
      title="Calendar"
      subtitle="Upcoming events and deadlines"
      queryKey={['student', 'calendar', organizationId]}
      fetcher={() => CalendarApi.list(organizationId)}
      keyExtractor={(e) => e.id}
      emptyTitle="No events"
      renderItem={(e) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {e.title}
            </AppText>
            {e.type ? <Badge label={e.type} tone="primary" /> : null}
          </Row>
          {e.startsAt ? (
            <AppText variant="caption">{new Date(e.startsAt).toLocaleString()}</AppText>
          ) : null}
          {e.description ? (
            <AppText variant="caption" numberOfLines={2}>
              {e.description}
            </AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
