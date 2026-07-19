import React from 'react';
import { RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  AssignmentsApi,
  CertificatesApi,
  CoursesApi,
  EnrollmentsApi,
  LiveSessionsApi,
} from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { AppText, Card, ErrorState, LoadingState, Row, Screen, StatTile } from '../../components/ui';

/**
 * Teacher analytics aggregates existing organization-scoped APIs — the same
 * approach as the web AnalyticsApi. No new backend endpoints are introduced.
 */
export default function TeacherAnalytics(): React.JSX.Element {
  const organizationId = useOrganizationId();

  const query = useQuery({
    queryKey: ['teacher', 'analytics', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const [courses, students, assignments, live, certificates] = await Promise.all([
        CoursesApi.list({ organizationId, limit: 1 }),
        EnrollmentsApi.list({ organizationId, limit: 1 }),
        AssignmentsApi.list({ organizationId, limit: 1 }),
        LiveSessionsApi.list({ organizationId, limit: 1 }),
        CertificatesApi.list({ organizationId, limit: 1 }),
      ]);
      return {
        courses: courses.meta.total,
        students: students.meta.total,
        assignments: assignments.meta.total,
        live: live.meta.total,
        certificates: certificates.meta.total,
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
          message={query.error instanceof Error ? query.error.message : 'Failed to load analytics.'}
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
      <AppText variant="caption">Organization-scoped teaching metrics.</AppText>

      <Row gap={3} align="stretch">
        <StatTile label="Courses" value={query.data.courses} />
        <StatTile label="Students" value={query.data.students} tone="success" />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Assignments" value={query.data.assignments} tone="warning" />
        <StatTile label="Live" value={query.data.live} />
      </Row>
      <Card>
        <AppText variant="subtitle">Certificates issued</AppText>
        <AppText variant="title">{query.data.certificates}</AppText>
      </Card>
      <View />
    </Screen>
  );
}
