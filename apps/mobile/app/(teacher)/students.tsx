import React from 'react';
import { EnrollmentsApi, type EnrollmentRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function TeacherStudents(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<EnrollmentRecord>
      title="Students"
      subtitle="Enrolled learners across your courses"
      queryKey={['teacher', 'students-list', organizationId]}
      fetcher={() => EnrollmentsApi.list({ organizationId, limit: 100 })}
      keyExtractor={(e) => e.id}
      emptyTitle="No students yet"
      renderItem={(e) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {e.courseTitle ?? 'Course'}
            </AppText>
            <Badge label={e.status} tone="primary" />
          </Row>
          <AppText variant="caption">Progress {Math.round(e.progress ?? 0)}%</AppText>
        </Card>
      )}
    />
  );
}
