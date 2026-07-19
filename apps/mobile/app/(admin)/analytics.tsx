import React from 'react';
import { RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  AdminApi,
  CoursesApi,
  LiveSessionsApi,
  PaymentsApi,
} from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { AppText, Card, ErrorState, LoadingState, Row, Screen, StatTile } from '../../components/ui';

export default function AdminAnalytics(): React.JSX.Element {
  const organizationId = useOrganizationId();
  const query = useQuery({
    queryKey: ['admin', 'analytics', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const [users, teachers, students, courses, live, invoices] = await Promise.all([
        AdminApi.listUsers({ organizationId, limit: 1 }),
        AdminApi.listUsers({ organizationId, limit: 1, role: 'Teacher' }),
        AdminApi.listUsers({ organizationId, limit: 1, role: 'Student' }),
        CoursesApi.list({ organizationId, limit: 1 }),
        LiveSessionsApi.list({ organizationId, limit: 1 }),
        PaymentsApi.invoices({ organizationId, limit: 1 }),
      ]);
      return {
        users: users.meta.total,
        teachers: teachers.meta.total,
        students: students.meta.total,
        courses: courses.meta.total,
        live: live.meta.total,
        invoices: invoices.meta.total,
      };
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          message={query.error instanceof Error ? query.error.message : 'Failed to load.'}
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
      }
    >
      <AppText variant="title">Analytics</AppText>
      <AppText variant="caption">Organization-wide metrics from existing APIs.</AppText>
      <Row gap={3} align="stretch">
        <StatTile label="Users" value={query.data.users} />
        <StatTile label="Teachers" value={query.data.teachers} tone="success" />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Students" value={query.data.students} tone="warning" />
        <StatTile label="Courses" value={query.data.courses} />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Live" value={query.data.live} />
        <StatTile label="Invoices" value={query.data.invoices} tone="primary" />
      </Row>
      <Card>
        <AppText variant="caption">
          Detailed charts remain available on the web admin portal. Mobile surfaces the same totals
          for at-a-glance monitoring.
        </AppText>
      </Card>
    </Screen>
  );
}
