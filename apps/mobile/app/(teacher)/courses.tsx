import React from 'react';
import { CoursesApi, type CourseRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function TeacherCourses(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<CourseRecord>
      title="Courses"
      subtitle="Courses you teach"
      queryKey={['teacher', 'courses-list', organizationId]}
      fetcher={() => CoursesApi.list({ organizationId, limit: 50, sortBy: 'title', sortOrder: 'asc' })}
      keyExtractor={(c) => c.id}
      emptyTitle="No courses"
      renderItem={(course) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {course.title}
            </AppText>
            <Badge label={course.status} tone={course.status === 'PUBLISHED' ? 'success' : 'default'} />
          </Row>
          <AppText variant="caption">
            {course.lessonCount ?? 0} lessons · {course.enrollmentCount ?? 0} students
          </AppText>
        </Card>
      )}
    />
  );
}
