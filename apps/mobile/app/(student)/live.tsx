import React, { useState } from 'react';
import { Alert } from 'react-native';
import { LiveSessionsApi, type LiveSessionRecord } from '../../lib/api/endpoints';
import { meetings } from '../../lib/video/meetings';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Button, Card, Row } from '../../components/ui';

function statusTone(status: string): 'success' | 'warning' | 'default' | 'primary' {
  if (status === 'LIVE' || status === 'IN_PROGRESS') return 'success';
  if (status === 'SCHEDULED') return 'primary';
  if (status === 'CANCELLED') return 'warning';
  return 'default';
}

export default function StudentLive(): React.JSX.Element {
  const organizationId = useOrganizationId();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const join = async (session: LiveSessionRecord) => {
    setJoiningId(session.id);
    try {
      const opened = await meetings.join(session);
      if (!opened) Alert.alert('No link yet', 'A join link is not available for this session.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <ResourceList<LiveSessionRecord>
      title="Live classes"
      subtitle="Join scheduled and live sessions"
      queryKey={['student', 'live', organizationId]}
      fetcher={() =>
        LiveSessionsApi.list({ organizationId, limit: 50, sortBy: 'startsAt', sortOrder: 'desc' })
      }
      keyExtractor={(session) => session.id}
      estimatedItemSize={140}
      emptyTitle="No live classes"
      renderItem={(session) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {session.title}
            </AppText>
            <Badge label={session.status} tone={statusTone(session.status)} />
          </Row>
          <AppText variant="caption">
            {session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Time TBA'}
            {session.provider ? ` · ${session.provider}` : ''}
          </AppText>
          <Button
            title="Join"
            onPress={() => void join(session)}
            loading={joiningId === session.id}
            disabled={!session.meetingUrl}
          />
        </Card>
      )}
    />
  );
}
