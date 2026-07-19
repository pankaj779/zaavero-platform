import React, { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationsApi, type NotificationRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Row,
} from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function StudentNotifications(): React.JSX.Element {
  const theme = useTheme();
  const organizationId = useOrganizationId();
  const queryClient = useQueryClient();
  const key = ['student', 'notifications', organizationId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => NotificationsApi.list(organizationId),
    enabled: Boolean(organizationId),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => NotificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  const markAll = useMutation({
    mutationFn: () => NotificationsApi.markAllRead(organizationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const onRefresh = useCallback(() => void query.refetch(), [query]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : 'Failed to load.'}
        onRetry={onRefresh}
      />
    );
  }

  const items = query.data?.items ?? [];

  return (
    <FlashList<NotificationRecord>
      data={items}
      keyExtractor={(n) => n.id}
      estimatedItemSize={96}
      contentContainerStyle={{ padding: theme.spacing(4) }}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing(3) }} />}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing(4), gap: theme.spacing(3) }}>
          <AppText variant="title">Notifications</AppText>
          <Button
            title="Mark all as read"
            variant="secondary"
            onPress={() => markAll.mutate()}
            loading={markAll.isPending}
          />
        </View>
      }
      ListEmptyComponent={<EmptyState title="You're all caught up" />}
      renderItem={({ item }) => (
        <Card onPress={() => !item.read && markRead.mutate(item.id)}>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {item.title}
            </AppText>
            {!item.read ? <Badge label="New" tone="primary" /> : null}
          </Row>
          {item.body ? (
            <AppText variant="caption" numberOfLines={2}>
              {item.body}
            </AppText>
          ) : null}
          {item.createdAt ? (
            <AppText variant="caption">{new Date(item.createdAt).toLocaleString()}</AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
