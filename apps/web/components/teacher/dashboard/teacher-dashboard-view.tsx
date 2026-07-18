'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TeacherDashboardApi } from '../../../lib/api';
import { useAuth, useOrganization } from '../../../lib/auth';
import { teacherDashboardCopy, type TeacherDashboardDto } from '../../../lib/teacher';
import { TeacherModuleErrorState, TeacherSectionCard } from '../shared';
import { TeacherGreeting } from './teacher-greeting';
import { TeacherStatGrid } from './teacher-stat-grid';

export function TeacherDashboardView(): React.JSX.Element {
  const { user } = useAuth();
  const { primaryOrganizationId } = useOrganization();
  const userId = user?.id ?? null;
  const [dashboard, setDashboard] = useState<TeacherDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (primaryOrganizationId === null || userId === null) {
      setDashboard(null);
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    void TeacherDashboardApi.getDashboard(primaryOrganizationId, userId)
      .then((result) => {
        if (requestId === requestIdRef.current) {
          setDashboard(result);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setDashboard(null);
          setError(true);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [primaryOrganizationId, requestVersion, userId]);

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  if (loading && dashboard === null) {
    return (
      <div className="space-y-8">
        <TeacherGreeting />
        <p className="py-12 text-center text-small text-muted-foreground" role="status">
          {teacherDashboardCopy.loadingLabel}
        </p>
      </div>
    );
  }

  if (error || dashboard === null) {
    return (
      <div className="space-y-8">
        <TeacherGreeting />
        <TeacherModuleErrorState
          title={teacherDashboardCopy.errorTitle}
          description={teacherDashboardCopy.errorDescription}
          retryLabel={teacherDashboardCopy.retryButton}
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TeacherGreeting />

      <TeacherStatGrid stats={dashboard.stats} />

      <div className="grid gap-4 laptop:grid-cols-2">
        <TeacherSectionCard
          title={dashboard.todaysClasses.title}
          description={dashboard.todaysClasses.description}
          emptyLabel={dashboard.todaysClasses.emptyLabel}
          items={dashboard.todaysClasses.items}
        />
        <TeacherSectionCard
          title={dashboard.upcomingWork.title}
          description={dashboard.upcomingWork.description}
          emptyLabel={dashboard.upcomingWork.emptyLabel}
          items={dashboard.upcomingWork.items}
        />
        <TeacherSectionCard
          className="laptop:col-span-2"
          title={dashboard.recentActivity.title}
          description={dashboard.recentActivity.description}
          emptyLabel={dashboard.recentActivity.emptyLabel}
          items={dashboard.recentActivity.items}
        />
      </div>
    </div>
  );
}
