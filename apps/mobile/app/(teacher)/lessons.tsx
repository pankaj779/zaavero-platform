import React from 'react';
import { LessonsApi, type LessonRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function TeacherLessons(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<LessonRecord>
      title="Lessons"
      subtitle="Lessons across your courses"
      queryKey={['teacher', 'lessons', organizationId]}
      fetcher={() => LessonsApi.list(organizationId, undefined, 1, 100)}
      keyExtractor={(l) => l.id}
      emptyTitle="No lessons"
      renderItem={(lesson) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {lesson.title}
            </AppText>
            {lesson.status ? <Badge label={lesson.status} /> : null}
          </Row>
          <AppText variant="caption">
            Course {lesson.courseId.slice(0, 8)}
            {lesson.durationMinutes ? ` · ${lesson.durationMinutes}m` : ''}
          </AppText>
        </Card>
      )}
    />
  );
}
