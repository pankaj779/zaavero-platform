import React, { useState } from 'react';
import { Alert } from 'react-native';
import { LiveSessionsApi, type LiveSessionRecord } from '../../lib/api/endpoints';
import { meetings } from '../../lib/video/meetings';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Button, Card, Row } from '../../components/ui';

export default function TeacherLive(): React.JSX.Element {
  const organizationId = useOrganizationId();
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (session: LiveSessionRecord, action: 'start' | 'end' | 'join') => {
    setBusyId(session.id);
    try {
      if (action === 'start') {
        const updated = await meetings.start(session.id);
        await meetings.join(updated);
      } else if (action === 'end') {
        await meetings.end(session.id);
        Alert.alert('Ended', 'The live session has been ended.');
      } else {
        const opened = await meetings.join(session);
        if (!opened) Alert.alert('No link', 'A join link is not available yet.');
      }
    } catch (err) {
      Alert.alert('Action failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ResourceList<LiveSessionRecord>
      title="Live classes"
      subtitle="Start, join or end sessions (Zoom / Meet / Sandbox)"
      queryKey={['teacher', 'live-list', organizationId]}
      fetcher={() =>
        LiveSessionsApi.list({ organizationId, limit: 50, sortBy: 'startsAt', sortOrder: 'desc' })
      }
      keyExtractor={(s) => s.id}
      emptyTitle="No live sessions"
      renderItem={(session) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {session.title}
            </AppText>
            <Badge label={session.status} tone="primary" />
          </Row>
          <AppText variant="caption">
            {session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Time TBA'}
            {session.provider ? ` · ${session.provider}` : ''}
          </AppText>
          <Row gap={2}>
            <Button title="Start" onPress={() => void act(session, 'start')} loading={busyId === session.id} />
            <Button title="Join" variant="secondary" onPress={() => void act(session, 'join')} />
            <Button title="End" variant="ghost" onPress={() => void act(session, 'end')} />
          </Row>
        </Card>
      )}
    />
  );
}
