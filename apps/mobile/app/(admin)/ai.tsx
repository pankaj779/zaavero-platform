import React from 'react';
import { RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AiApi } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { AIChat } from '../../components/ai-chat';
import { AppText, Card, LoadingState, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function AdminAi(): React.JSX.Element {
  const theme = useTheme();
  const organizationId = useOrganizationId();

  const health = useQuery({
    queryKey: ['admin', 'ai-health'],
    queryFn: () => AiApi.adminHealth(),
  });
  const usage = useQuery({
    queryKey: ['admin', 'ai-usage', organizationId],
    queryFn: () => AiApi.adminUsage(organizationId),
    enabled: Boolean(organizationId),
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen
        scroll
        padded
        refreshControl={
          <RefreshControl
            refreshing={health.isRefetching || usage.isRefetching}
            onRefresh={() => {
              void health.refetch();
              void usage.refetch();
            }}
          />
        }
      >
        <AppText variant="title">AI Admin</AppText>
        <Card>
          <AppText variant="subtitle">Provider health</AppText>
          {health.isLoading ? (
            <LoadingState />
          ) : (
            <AppText variant="caption">{JSON.stringify(health.data ?? {}, null, 2)}</AppText>
          )}
        </Card>
        <Card>
          <AppText variant="subtitle">Usage (30d)</AppText>
          {usage.isLoading ? (
            <LoadingState />
          ) : (
            <AppText variant="caption">{JSON.stringify(usage.data ?? {}, null, 2)}</AppText>
          )}
        </Card>
      </Screen>
      <View style={{ flex: 1, minHeight: 280 }}>
        <AIChat
          feature="TUTOR"
          placeholder="Admin AI workspace…"
          intro="Admin AI workspace reuses the Phase 16 platform with admin role restrictions."
        />
      </View>
    </View>
  );
}
