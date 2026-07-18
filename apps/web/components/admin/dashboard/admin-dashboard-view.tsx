'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminOverviewDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { ADMIN_ROUTES } from '../../../lib/constants';
import { TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

export function AdminDashboardView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!primaryOrganizationId) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    void AdminApi.getOverview(primaryOrganizationId)
      .then((result) => {
        if (requestId === requestIdRef.current) {
          setOverview(result);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError(true);
          setOverview(null);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [primaryOrganizationId, version]);

  const retry = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  if (loading && overview === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Admin Dashboard" description="Loading organization statistics…" />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading admin dashboard…
        </p>
      </div>
    );
  }

  if (error || overview === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Admin Dashboard"
          description="Organization health, academic activity, and operational status."
        />
        <TeacherModuleErrorState
          title="Unable to load admin dashboard"
          description="Retry to reload organization statistics."
          onRetry={retry}
        />
      </div>
    );
  }

  const stats = [
    { label: 'Users', value: overview.counts.users, href: ADMIN_ROUTES.users },
    { label: 'Teachers', value: overview.counts.teachers, href: ADMIN_ROUTES.teachers },
    { label: 'Students', value: overview.counts.students, href: ADMIN_ROUTES.students },
    { label: 'Courses', value: overview.counts.courses, href: ADMIN_ROUTES.courses },
    { label: 'Batches', value: overview.counts.batches, href: ADMIN_ROUTES.batches },
    { label: 'Enrollments', value: overview.counts.enrollments, href: ADMIN_ROUTES.students },
    { label: 'Assignments', value: overview.counts.assignments, href: ADMIN_ROUTES.assignments },
    { label: 'Certificates', value: overview.counts.certificates, href: ADMIN_ROUTES.certificates },
    { label: 'Attendance', value: overview.counts.attendances, href: ADMIN_ROUTES.attendance },
    { label: 'Live Classes', value: overview.counts.liveSessions, href: ADMIN_ROUTES.liveClasses },
    {
      label: 'Notifications',
      value: overview.counts.notifications,
      href: ADMIN_ROUTES.notifications,
    },
    { label: 'Revenue', value: '—', href: ADMIN_ROUTES.payments },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Organization health, academic activity, and operational status."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={ADMIN_ROUTES.users}>Manage users</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ADMIN_ROUTES.academic}>Academic hub</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ADMIN_ROUTES.auditLogs}>Audit logs</Link>
            </Button>
          </div>
        }
      />

      <section
        className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4"
        aria-label="Organization statistics"
      >
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="focus-visible:outline-none">
            <Card className="h-full rounded-xl transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
              <CardHeader className="pb-2">
                <p className="text-caption text-muted-foreground">{stat.label}</p>
                <CardTitle className="text-2xl">{String(stat.value)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-caption text-muted-foreground">
                  {stat.label === 'Revenue'
                    ? 'Open Payments for live revenue KPIs'
                    : 'Live organization total'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 laptop:grid-cols-3" aria-label="System status">
        {Object.entries(overview.systemStatus).map(([key, value]) => (
          <Card key={key} className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base capitalize">{key}</CardTitle>
              <Badge variant="secondary">{value.replaceAll('_', ' ')}</Badge>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 laptop:grid-cols-3" aria-label="Recent activity panels">
        <RecentList
          title="Recent enrollments"
          items={overview.recentEnrollments.map((item) => ({
            id: item.id,
            title: item.course.title,
            detail: `${item.batch.name} · ${item.status}`,
          }))}
          empty="No enrollments yet"
        />
        <RecentList
          title="Recent certificates"
          items={overview.recentCertificates.map((item) => ({
            id: item.id,
            title: item.course.title,
            detail: `${item.status}${item.certificateNumber ? ` · ${item.certificateNumber}` : ''}`,
          }))}
          empty="No certificates yet"
        />
        <RecentList
          title="Recent assignments"
          items={overview.recentAssignments.map((item) => ({
            id: item.id,
            title: item.title,
            detail: `${item.course.title} · ${item.status}`,
          }))}
          empty="No assignments yet"
        />
      </section>

      <RecentList
        title="Recent audit activity"
        items={overview.recentActivity.map((item) => ({
          id: item.id,
          title: item.action,
          detail: `${item.entity}${item.user ? ` · ${item.user.firstName} ${item.user.lastName}` : ''}`,
        }))}
        empty="No audit activity yet"
      />
    </div>
  );
}

function RecentList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { id: string; title: string; detail: string }[];
  empty: string;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-small text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-caption text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
