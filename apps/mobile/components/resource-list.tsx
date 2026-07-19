import React, { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { Paginated } from '../lib/api/endpoints';
import { AppText, EmptyState, ErrorState, LoadingState } from './ui';
import { useTheme } from '../lib/theme/theme';

interface ResourceListProps<T> {
  title?: string;
  subtitle?: string;
  queryKey: QueryKey;
  fetcher: () => Promise<Paginated<T> | T[]>;
  renderItem: (item: T) => React.ReactElement;
  keyExtractor: (item: T) => string;
  estimatedItemSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  header?: React.ReactElement;
}

function toArray<T>(data: Paginated<T> | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items;
}

/**
 * Generic, performance-tuned list backed by React Query + FlashList.
 * Handles loading/error/empty states, pull-to-refresh, and cache reuse so the
 * same data is available offline once fetched.
 */
export function ResourceList<T>({
  title,
  subtitle,
  queryKey,
  fetcher,
  renderItem,
  keyExtractor,
  estimatedItemSize = 96,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  header,
}: ResourceListProps<T>): React.JSX.Element {
  const theme = useTheme();
  const query = useQuery({ queryKey, queryFn: fetcher });
  const items = toArray<T>(query.data);

  const onRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : 'Failed to load.'}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <FlashList
      data={items}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      contentContainerStyle={{ padding: theme.spacing(4) }}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing(3) }} />}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      ListHeaderComponent={
        header ??
        (title ? (
          <View style={{ marginBottom: theme.spacing(4), gap: theme.spacing(1) }}>
            <AppText variant="title">{title}</AppText>
            {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
          </View>
        ) : null)
      }
      ListEmptyComponent={<EmptyState title={emptyTitle} message={emptyMessage} />}
    />
  );
}
