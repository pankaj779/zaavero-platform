import React, { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth/auth-context';
import { useOrganizationId } from '../../lib/hooks/use-org';
import {
  AssignmentsApi,
  CertificatesApi,
  EnrollmentsApi,
  LiveSessionsApi,
} from '../../lib/api/endpoints';
import { AppText, Button, Card, Row, Screen, StatTile } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function StudentDashboard(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = useOrganizationId();

  const enrollments = useQuery({
    queryKey: ['student', 'enrollments', organizationId],
    queryFn: () => EnrollmentsApi.list({ organizationId, limit: 100 }),
    enabled: Boolean(organizationId),
  });
  const assignments = useQuery({
    queryKey: ['student', 'assignments', organizationId],
    queryFn: () => AssignmentsApi.list({ organizationId, limit: 50 }),
    enabled: Boolean(organizationId),
  });
  const certificates = useQuery({
    queryKey: ['student', 'certificates', organizationId],
    queryFn: () => CertificatesApi.list({ organizationId, limit: 50 }),
    enabled: Boolean(organizationId),
  });
  const live = useQuery({
    queryKey: ['student', 'live', organizationId, 'upcoming'],
    queryFn: () => LiveSessionsApi.list({ organizationId, limit: 20, status: 'SCHEDULED' }),
    enabled: Boolean(organizationId),
  });

  const refreshing =
    enrollments.isRefetching ||
    assignments.isRefetching ||
    certificates.isRefetching ||
    live.isRefetching;

  const onRefresh = useCallback(() => {
    void enrollments.refetch();
    void assignments.refetch();
    void certificates.refetch();
    void live.refetch();
  }, [enrollments, assignments, certificates, live]);

  const nextSession = live.data?.items[0];

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <AppText variant="title">Hi {user?.firstName || 'there'}</AppText>
      <AppText variant="caption">Here is your learning at a glance.</AppText>

      <Row gap={3} align="stretch">
        <StatTile label="Courses" value={enrollments.data?.meta.total ?? 0} />
        <StatTile label="Assignments" value={assignments.data?.meta.total ?? 0} tone="warning" />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Certificates" value={certificates.data?.meta.total ?? 0} tone="success" />
        <StatTile label="Live soon" value={live.data?.meta.total ?? 0} tone="primary" />
      </Row>

      {nextSession ? (
        <Card>
          <AppText variant="label">Next live class</AppText>
          <AppText variant="subtitle">{nextSession.title}</AppText>
          <AppText variant="caption">
            {nextSession.startsAt
              ? new Date(nextSession.startsAt).toLocaleString()
              : 'Time to be announced'}
          </AppText>
          <View style={{ marginTop: theme.spacing(2) }}>
            <Button
              title="View live classes"
              variant="secondary"
              onPress={() => router.push('/(student)/live')}
            />
          </View>
        </Card>
      ) : null}

      <Card>
        <AppText variant="subtitle">Quick actions</AppText>
        <View style={{ gap: theme.spacing(2), marginTop: theme.spacing(2) }}>
          <Button title="Browse courses" onPress={() => router.push('/(student)/courses')} />
          <Button
            title="Ask the AI Tutor"
            variant="secondary"
            onPress={() => router.push('/(student)/ai')}
          />
          <Button
            title="My downloads"
            variant="ghost"
            onPress={() => router.push('/(student)/downloads')}
          />
        </View>
      </Card>
    </Screen>
  );
}
