'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { useEffect, useState } from 'react';
import { AiApi, type AIAdminUsageSummaryDto, type AIProviderHealthDto } from '../../../lib/api/ai';
import { useOrganization } from '../../../lib/auth';
import { AdminPageHeader } from '../../../components/admin/shared';

export default function AdminAIPage(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [health, setHealth] = useState<AIProviderHealthDto | null>(null);
  const [usage, setUsage] = useState<AIAdminUsageSummaryDto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!primaryOrganizationId) return;
    void Promise.all([AiApi.getProviderHealth(), AiApi.getUsageSummary(primaryOrganizationId)])
      .then(([providerHealth, usageSummary]) => {
        setHealth(providerHealth);
        setUsage(usageSummary);
      })
      .catch(() => {
        setError(true);
      });
  }, [primaryOrganizationId]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Platform"
        description="Provider health, token usage, and organization AI activity."
      />
      {error ? <p className="text-sm text-destructive">Unable to load AI admin data.</p> : null}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provider Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {health ? (
              <>
                <Badge variant={health.healthy ? 'success' : 'danger'}>{health.provider}</Badge>
                <p className="text-sm">Configured: {health.configured ? 'Yes' : 'No'}</p>
                <p className="text-sm">Healthy: {health.healthy ? 'Yes' : 'No'}</p>
                {health.message ? <p className="text-sm text-muted-foreground">{health.message}</p> : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading provider health…</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {usage ? (
              <>
                <p className="text-sm">Total tokens: {usage.totalTokens.toLocaleString()}</p>
                <p className="text-sm">Total requests: {usage.totalRequests.toLocaleString()}</p>
                <div className="space-y-1">
                  {usage.byFeature.slice(0, 5).map((row: { feature: string; totalTokens: number }) => (
                    <p key={row.feature} className="text-sm text-muted-foreground">
                      {row.feature}: {row.totalTokens.toLocaleString()} tokens
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading usage…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
