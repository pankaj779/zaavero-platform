import React from 'react';
import { MessagingApi, type ConversationRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function TeacherMessages(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<ConversationRecord>
      title="Messages"
      subtitle="Conversations with students and staff"
      queryKey={['teacher', 'conversations', organizationId]}
      fetcher={() => MessagingApi.listConversations(organizationId)}
      keyExtractor={(c) => c.id}
      emptyTitle="No conversations"
      renderItem={(c) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {c.title ?? 'Conversation'}
            </AppText>
            {c.unreadCount ? <Badge label={String(c.unreadCount)} tone="primary" /> : null}
          </Row>
          {c.lastMessagePreview ? (
            <AppText variant="caption" numberOfLines={1}>
              {c.lastMessagePreview}
            </AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
