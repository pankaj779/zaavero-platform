import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  AssignmentsApi,
  CertificatesApi,
  CoursesApi,
  LessonsApi,
} from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { AppText, Button, Card, LoadingState, Row, Screen, StatTile } from '../../components/ui';

export default function AdminAcademic(): React.JSX.Element {
  const router = useRouter();
  const organizationId = useOrganizationId();

  const query = useQuery({
    queryKey: ['admin', 'academic', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const [courses, lessons, assignments, certificates] = await Promise.all([
        CoursesApi.list({ organizationId, limit: 1 }),
        LessonsApi.list(organizationId, undefined, 1, 1),
        AssignmentsApi.list({ organizationId, limit: 1 }),
        CertificatesApi.list({ organizationId, limit: 1 }),
      ]);
      return {
        courses: courses.meta.total,
        lessons: lessons.meta.total,
        assignments: assignments.meta.total,
        certificates: certificates.meta.total,
      };
    },
  });

  if (query.isLoading || !query.data) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">Academic</AppText>
      <AppText variant="caption">Courses, lessons, assignments and certificates.</AppText>
      <Row gap={3} align="stretch">
        <StatTile label="Courses" value={query.data.courses} />
        <StatTile label="Lessons" value={query.data.lessons} tone="success" />
      </Row>
      <Row gap={3} align="stretch">
        <StatTile label="Assignments" value={query.data.assignments} tone="warning" />
        <StatTile label="Certificates" value={query.data.certificates} />
      </Row>
      <Card>
        <AppText variant="caption">
          Manage academic content through the existing NestJS APIs. Deep editing remains available on
          the web admin portal.
        </AppText>
        <Button
          title="View users"
          variant="secondary"
          onPress={() => router.push('/(admin)/users')}
        />
      </Card>
    </Screen>
  );
}
