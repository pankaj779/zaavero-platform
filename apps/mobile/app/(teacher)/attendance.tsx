import React from 'react';
import { AttendanceApi, type AttendanceRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function TeacherAttendance(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<AttendanceRecord>
      title="Attendance"
      subtitle="Session attendance records"
      queryKey={['teacher', 'attendance', organizationId]}
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
            <Badge label={a.status} />
          </Row>
          {a.date ? (
            <AppText variant="caption">{new Date(a.date).toLocaleDateString()}</AppText>
          ) : null}
        </Card>
      )}
    />
  );
}
