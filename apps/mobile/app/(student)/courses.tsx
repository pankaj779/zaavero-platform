import React from 'react';
import { useRouter } from 'expo-router';
import { CoursesApi, type CourseRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function StudentCourses(): React.JSX.Element {
  const router = useRouter();
  const organizationId = useOrganizationId();

  return (
    <ResourceList<CourseRecord>
      title="Courses"
      subtitle="Explore and continue your courses"
      queryKey={['student', 'courses', organizationId]}
      fetcher={() => CoursesApi.list({ organizationId, limit: 50, sortBy: 'title', sortOrder: 'asc' })}
      keyExtractor={(course) => course.id}
      estimatedItemSize={120}
      emptyTitle="No courses yet"
      emptyMessage="Courses assigned to you will appear here."
      renderItem={(course) => (
        <Card onPress={() => router.push(`/(student)/course/${course.id}`)}>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {course.title}
            </AppText>
            <Badge label={course.status} tone={course.status === 'PUBLISHED' ? 'success' : 'default'} />
          </Row>
          {course.description ? (
            <AppText variant="caption" numberOfLines={2}>
              {course.description}
            </AppText>
          ) : null}
          <Row gap={3}>
            <AppText variant="caption">{course.lessonCount ?? 0} lessons</AppText>
            {course.difficulty ? <AppText variant="caption">· {course.difficulty}</AppText> : null}
          </Row>
        </Card>
      )}
    />
  );
}
