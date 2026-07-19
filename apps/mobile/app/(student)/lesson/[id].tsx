import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useQuery } from '@tanstack/react-query';
import { LessonProgressApi, LessonsApi } from '../../../lib/api/endpoints';
import { useOrganizationId } from '../../../lib/hooks/use-org';
import { downloads } from '../../../lib/downloads/downloads';
import {
  AppText,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
} from '../../../components/ui';
import { useTheme } from '../../../lib/theme/theme';

export default function LessonPlayer(): React.JSX.Element {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const organizationId = useOrganizationId();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const lesson = useQuery({
    queryKey: ['student', 'lesson', id],
    queryFn: () => LessonsApi.get(id),
    enabled: Boolean(id),
  });

  const videoUrl = lesson.data?.videoUrl ?? lesson.data?.contentUrl ?? null;
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  const markComplete = useCallback(async () => {
    if (!lesson.data) return;
    setSaving(true);
    try {
      await LessonProgressApi.upsert({
        organizationId,
        lessonId: lesson.data.id,
        status: 'COMPLETED',
        progress: 100,
      });
      Alert.alert('Progress saved', 'This lesson is marked complete.');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again later.');
    } finally {
      setSaving(false);
    }
  }, [lesson.data, organizationId]);

  const saveOffline = useCallback(async () => {
    if (!lesson.data || !videoUrl) return;
    setDownloading(true);
    try {
      const entry = await downloads.save({
        id: `lesson-${lesson.data.id}`,
        kind: 'lesson',
        title: lesson.data.title,
        sourcePath: videoUrl,
        fileName: `lesson-${lesson.data.id}.mp4`,
      });
      Alert.alert(entry ? 'Downloaded' : 'Download failed', entry ? 'Available offline in Downloads.' : 'Try again.');
    } finally {
      setDownloading(false);
    }
  }, [lesson.data, videoUrl]);

  if (lesson.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (lesson.isError || !lesson.data) {
    return (
      <Screen>
        <ErrorState
          message={lesson.error instanceof Error ? lesson.error.message : 'Failed to load lesson.'}
          onRetry={() => void lesson.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">{lesson.data.title}</AppText>
      {lesson.data.contentType ? <Badge label={lesson.data.contentType} tone="primary" /> : null}

      {videoUrl ? (
        <VideoView
          player={player}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: theme.radius.lg,
            backgroundColor: '#000',
          }}
          allowsFullscreen
          allowsPictureInPicture
        />
      ) : (
        <Card>
          <AppText variant="caption">This lesson has no video content.</AppText>
        </Card>
      )}

      {lesson.data.description ? (
        <Card>
          <AppText variant="body">{lesson.data.description}</AppText>
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing(2), marginTop: theme.spacing(2) }}>
        <Button title="Mark as complete" onPress={markComplete} loading={saving} />
        {videoUrl ? (
          <Button
            title="Download for offline"
            variant="secondary"
            onPress={saveOffline}
            loading={downloading}
          />
        ) : null}
      </View>
    </Screen>
  );
}
