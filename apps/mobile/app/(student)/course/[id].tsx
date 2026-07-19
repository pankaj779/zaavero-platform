import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CoursesApi, LessonsApi, type LessonRecord } from '../../../lib/api/endpoints';
import { useOrganizationId } from '../../../lib/hooks/use-org';
import {
  AppText,
  Badge,
  Card,
  ErrorState,
  LoadingState,
  Row,
  Screen,
} from '../../../components/ui';
import { useTheme } from '../../../lib/theme/theme';

export default function CourseDetail(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const organizationId = useOrganizationId();

  const course = useQuery({
    queryKey: ['student', 'course', id],
    queryFn: () => CoursesApi.get(id),
    enabled: Boolean(id),
  });
  const lessons = useQuery({
    queryKey: ['student', 'course', id, 'lessons'],
    queryFn: () => LessonsApi.list(organizationId, id, 1, 100),
    enabled: Boolean(id && organizationId),
  });

  if (course.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (course.isError || !course.data) {
    return (
      <Screen>
        <ErrorState
          message={course.error instanceof Error ? course.error.message : 'Failed to load course.'}
          onRetry={() => void course.refetch()}
        />
      </Screen>
    );
  }

  const orderedLessons = [...(lessons.data?.items ?? [])].sort(
    (a: LessonRecord, b: LessonRecord) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <Screen scroll>
      <AppText variant="title">{course.data.title}</AppText>
      <Row gap={2}>
        <Badge label={course.data.status} tone="primary" />
        {course.data.difficulty ? <Badge label={course.data.difficulty} /> : null}
      </Row>
      {course.data.description ? (
        <AppText variant="body">{course.data.description}</AppText>
      ) : null}

      <AppText variant="heading" style={{ marginTop: theme.spacing(4) }}>
        Lessons
      </AppText>
      {lessons.isLoading ? (
        <LoadingState />
      ) : (
        <View style={{ gap: theme.spacing(3) }}>
          {orderedLessons.map((lesson, index) => (
            <Card key={lesson.id} onPress={() => router.push(`/(student)/lesson/${lesson.id}`)}>
              <Row justify="space-between">
                <AppText variant="subtitle" numberOfLines={1}>
                  {index + 1}. {lesson.title}
                </AppText>
                {lesson.durationMinutes ? (
                  <AppText variant="caption">{lesson.durationMinutes}m</AppText>
                ) : null}
              </Row>
              {lesson.description ? (
                <AppText variant="caption" numberOfLines={2}>
                  {lesson.description}
                </AppText>
              ) : null}
            </Card>
          ))}
          {orderedLessons.length === 0 ? (
            <AppText variant="caption">No lessons published yet.</AppText>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
