import React, { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth/auth-context';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { AdminApi, CoursesApi, PaymentsApi } from '../../lib/api/endpoints';
import { AppText, Button, Card, Row, Screen, StatTile } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function AdminDashboard(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = useOrganizationId();

  const users = useQuery({
    queryKey: ['admin', 'users-count', organizationId],
    queryFn: () => AdminApi.listUsers({ organizationId, limit: 1 }),
    enabled: Boolean(organizationId),
  });
  const teachers = useQuery({
    queryKey: ['admin', 'teachers-count', organizationId],
    queryFn: () => AdminApi.listUsers({ organizationId, limit: 1, role: 'Teacher' }),
    enabled: Boolean(organizationId),
  });
  const students = useQuery({
    queryKey: ['admin', 'students-count', organizationId],
    queryFn: () => AdminApi.listUsers({ organizationId, limit: 1, role: 'Student' }),
    enabled: Boolean(organizationId),
  });
  const courses = useQuery({
    queryKey: ['admin', 'courses-count', organizationId],
    queryFn: () => CoursesApi.list({ organizationId, limit: 1 }),
    enabled: Boolean(organizationId),
  });
  const invoices = useQuery({
    queryKey: ['admin', 'invoices-count', organizationId],
    queryFn: () => PaymentsApi.invoices({ organizationId, limit: 1 }),
    enabled: Boolean(organizationId),
  });

  const refreshing =
    users.isRefetching ||
    teachers.isRefetching ||
    students.isRefetching ||
    courses.isRefetching ||
    invoices.isRefetching;

  const onRefresh = useCallback(() => {
    void users.refetch();
    void teachers.refetch();
    void students.refetch();
    void courses.refetch();
    void invoices.refetch();
  }, [users, teachers, students, courses, invoices]);

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <AppText variant="title">Admin</AppText>
      <AppText variant="caption">Signed in as {user?.email}</AppText>

      <Row gap={3} align="stretch">
        <StatTile label="Users" value={users.data?.meta.total ?? 0} />
        <StatTile label="Teachers" value={teachers.data?.meta.total ?? 0} tone="success" />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Students" value={students.data?.meta.total ?? 0} tone="warning" />
        <StatTile label="Courses" value={courses.data?.meta.total ?? 0} />
      </Row>
      <Card>
        <AppText variant="subtitle">Invoices</AppText>
        <AppText variant="title">{invoices.data?.meta.total ?? 0}</AppText>
      </Card>

      <Card>
        <AppText variant="subtitle">Quick actions</AppText>
        <View style={{ gap: theme.spacing(2), marginTop: theme.spacing(2) }}>
          <Button title="Manage users" onPress={() => router.push('/(admin)/users')} />
          <Button title="Audit logs" variant="secondary" onPress={() => router.push('/(admin)/audit')} />
          <Button title="AI admin" variant="ghost" onPress={() => router.push('/(admin)/ai')} />
        </View>
      </Card>
    </Screen>
  );
}
