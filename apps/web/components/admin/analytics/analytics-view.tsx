'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdminOverviewDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleErrorState } from '../../teacher/shared';
import { AdminCapabilityNotice, AdminPageHeader } from '../shared';

export function AdminAnalyticsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setError(true);
      setLoading(false);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(false);
    try {
      const result = await AdminApi.getOverview(primaryOrganizationId);
      if (requestId === requestIdRef.current) {
        setOverview(result);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setOverview(null);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [primaryOrganizationId]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const derived = useMemo(() => {
    if (!overview) {
      return null;
    }
    const { counts } = overview;
    const completionRate =
      counts.enrollments > 0 ? Math.round((counts.certificates / counts.enrollments) * 100) : 0;
    const attendanceCoverage =
      counts.liveSessions > 0 ? Math.round((counts.attendances / counts.liveSessions) * 100) : 0;
    return {
      completionRate,
      attendanceCoverage,
      teacherStudentRatio:
        counts.teachers > 0 ? (counts.students / counts.teachers).toFixed(1) : '—',
      assignmentLoad: counts.courses > 0 ? (counts.assignments / counts.courses).toFixed(1) : '—',
    };
  }, [overview]);

  if (loading && overview === null && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Organization Analytics"
          description="Live organization KPIs derived from existing operational data."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading analytics…
        </p>
      </div>
    );
  }

  if (error || overview === null || derived === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Organization Analytics"
          description="Live organization KPIs derived from existing operational data."
        />
        <TeacherModuleErrorState
          title="Unable to load analytics"
          description="Retry to reload organization KPIs."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  const kpis = [
    { label: 'Students', value: overview.counts.students },
    { label: 'Teachers', value: overview.counts.teachers },
    { label: 'Courses', value: overview.counts.courses },
    { label: 'Enrollments', value: overview.counts.enrollments },
    { label: 'Certificates', value: overview.counts.certificates },
    { label: 'Attendance records', value: overview.counts.attendances },
    { label: 'Live classes', value: overview.counts.liveSessions },
    { label: 'Revenue', value: '—' },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Organization Analytics"
        description="Live organization KPIs derived from existing operational data."
      />

      <section
        className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4"
        aria-label="Organization KPIs"
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-xl">
            <CardHeader className="pb-2">
              <p className="text-caption text-muted-foreground">{kpi.label}</p>
              <CardTitle className="text-2xl">{String(kpi.value)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                {kpi.label === 'Revenue'
                  ? 'See Payments workspace for revenue KPIs'
                  : 'Derived from live admin overview'}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 laptop:grid-cols-2" aria-label="Derived charts">
        <ChartCard
          title="Certificate completion"
          value={`${String(derived.completionRate)}%`}
          helper="Certificates divided by enrollments"
          percent={derived.completionRate}
        />
        <ChartCard
          title="Attendance coverage"
          value={`${String(derived.attendanceCoverage)}%`}
          helper="Attendance records relative to live sessions"
          percent={Math.min(100, derived.attendanceCoverage)}
        />
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Teaching load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{derived.teacherStudentRatio}</p>
            <p className="text-caption text-muted-foreground">Students per teacher</p>
            <p className="text-small text-muted-foreground">
              Average assignments per course: {derived.assignmentLoad}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Operational volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-small text-muted-foreground">
            <p>Users: {overview.counts.users}</p>
            <p>Batches: {overview.counts.batches}</p>
            <p>Assignments: {overview.counts.assignments}</p>
            <p>Submissions: {overview.counts.submissions}</p>
            <p>Notifications: {overview.counts.notifications}</p>
          </CardContent>
        </Card>
      </section>

      <AdminCapabilityNotice
        title="Revenue analytics"
        description="Organization revenue KPIs live in the Payments workspace. This analytics view does not fabricate revenue from non-payment sources."
      />
    </div>
  );
}

function ChartCard({
  title,
  value,
  helper,
  percent,
}: {
  title: string;
  value: string;
  helper: string;
  percent: number;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-semibold">{value}</p>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`${title}: ${value}`}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${String(percent)}%` }}
          />
        </div>
        <p className="text-caption text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
