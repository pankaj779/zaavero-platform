import React, { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { downloads, type DownloadEntry } from '../../lib/downloads/downloads';
import { media } from '../../lib/media/media';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Row,
} from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function StudentDownloads(): React.JSX.Element {
  const theme = useTheme();
  const [items, setItems] = useState<DownloadEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await downloads.list());
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (items === null) return <LoadingState />;

  return (
    <FlashList
      data={items}
      keyExtractor={(e) => e.id}
      estimatedItemSize={110}
      contentContainerStyle={{ padding: theme.spacing(4) }}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing(3) }} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} />}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing(4), gap: theme.spacing(2) }}>
          <AppText variant="title">Downloads</AppText>
          <AppText variant="caption">Offline lessons, PDFs, certificates and invoices.</AppText>
          {items.length > 0 ? (
            <Button
              title="Clear all"
              variant="ghost"
              onPress={() => void downloads.clearAll().then(load)}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Nothing downloaded"
          message="Save lessons, certificates or invoices for offline access."
        />
      }
      renderItem={({ item }) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {item.title}
            </AppText>
            <Badge label={item.kind} tone="primary" />
          </Row>
          <AppText variant="caption">
            {new Date(item.downloadedAt).toLocaleString()}
            {item.sizeBytes ? ` · ${Math.round(item.sizeBytes / 1024)} KB` : ''}
          </AppText>
          <Row gap={2}>
            <View style={{ flex: 1 }}>
              <Button title="Open" variant="secondary" onPress={() => void media.share(item.localUri)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Remove"
                variant="ghost"
                onPress={() => void downloads.remove(item.id).then(load)}
              />
            </View>
          </Row>
        </Card>
      )}
    />
  );
}
