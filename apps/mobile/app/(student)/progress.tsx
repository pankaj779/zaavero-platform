import React from 'react';
import { View } from 'react-native';
import { EnrollmentsApi, type EnrollmentRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Card, Row } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

function ProgressBar({ value }: { value: number }): React.JSX.Element {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: theme.colors.primary,
        }}
      />
    </View>
  );
}

export default function StudentProgress(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<EnrollmentRecord>
      title="Progress"
      subtitle="Completion across your courses"
      queryKey={['student', 'progress', organizationId]}
      fetcher={() => EnrollmentsApi.list({ organizationId, limit: 100 })}
      keyExtractor={(e) => e.id}
      emptyTitle="No enrolled courses"
      renderItem={(e) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {e.courseTitle ?? 'Course'}
            </AppText>
            <AppText variant="label">{Math.round(e.progress ?? 0)}%</AppText>
          </Row>
          <ProgressBar value={e.progress ?? 0} />
        </Card>
      )}
    />
  );
}
