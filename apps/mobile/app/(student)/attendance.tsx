import React from 'react';
import { AttendanceApi, type AttendanceRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

function tone(status: string): 'success' | 'danger' | 'warning' | 'default' {
  if (status === 'PRESENT') return 'success';
  if (status === 'ABSENT') return 'danger';
  if (status === 'LATE' || status === 'EXCUSED') return 'warning';
  return 'default';
}

export default function StudentAttendance(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AttendanceRecord>
      title="Attendance"
      subtitle="Your session attendance record"
      queryKey={['student', 'attendance', organizationId]}
      fetcher={() =>
        AttendanceApi.list({ organizationId, limit: 100, sortBy: 'date', sortOrder: 'desc' })
      }
      keyExtractor={(a) => a.id}
      emptyTitle="No attendance records"
      renderItem={(a) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {a.sessionTitle ?? 'Session'}
            </AppText>
            <Badge label={a.status} tone={tone(a.status)} />
          </Row>
          {a.date ? (
            <AppText variant="caption">{new Date(a.date).toLocaleDateString()}</AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
