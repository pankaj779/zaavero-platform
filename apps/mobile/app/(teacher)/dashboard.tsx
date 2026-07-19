import React, { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth/auth-context';
import { useOrganizationId } from '../../lib/hooks/use-org';
import {
  AssignmentsApi,
  CoursesApi,
  EnrollmentsApi,
  LiveSessionsApi,
} from '../../lib/api/endpoints';
import { AppText, Button, Card, Row, Screen, StatTile } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function TeacherDashboard(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = useOrganizationId();

  const courses = useQuery({
    queryKey: ['teacher', 'courses', organizationId],
    queryFn: () => CoursesApi.list({ organizationId, limit: 100 }),
    enabled: Boolean(organizationId),
  });
  const students = useQuery({
    queryKey: ['teacher', 'students', organizationId],
    queryFn: () => EnrollmentsApi.list({ organizationId, limit: 100 }),
    enabled: Boolean(organizationId),
  });
  const assignments = useQuery({
    queryKey: ['teacher', 'assignments', organizationId],
    queryFn: () => AssignmentsApi.list({ organizationId, limit: 50 }),
    enabled: Boolean(organizationId),
  });
  const live = useQuery({
    queryKey: ['teacher', 'live', organizationId],
    queryFn: () => LiveSessionsApi.list({ organizationId, limit: 20 }),
    enabled: Boolean(organizationId),
  });

  const refreshing =
    courses.isRefetching || students.isRefetching || assignments.isRefetching || live.isRefetching;
  const onRefresh = useCallback(() => {
    void courses.refetch();
    void students.refetch();
    void assignments.refetch();
    void live.refetch();
  }, [courses, students, assignments, live]);

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <AppText variant="title">Welcome, {user?.firstName || 'Teacher'}</AppText>
      <AppText variant="caption">Your teaching overview.</AppText>

      <Row gap={3} align="stretch">
        <StatTile label="Courses" value={courses.data?.meta.total ?? 0} />
        <StatTile label="Students" value={students.data?.meta.total ?? 0} tone="success" />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Assignments" value={assignments.data?.meta.total ?? 0} tone="warning" />
        <StatTile label="Live sessions" value={live.data?.meta.total ?? 0} />
      </Row>

      <Card>
        <AppText variant="subtitle">Quick actions</AppText>
        <View style={{ gap: theme.spacing(2), marginTop: theme.spacing(2) }}>
          <Button title="Manage courses" onPress={() => router.push('/(teacher)/courses')} />
          <Button title="AI workspace" variant="secondary" onPress={() => router.push('/(teacher)/ai')} />
          <Button title="Start / join live" variant="ghost" onPress={() => router.push('/(teacher)/live')} />
        </View>
      </Card>
    </Screen>
  );
}
