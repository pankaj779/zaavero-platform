'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useAuth, useOrganization } from '../../../lib/auth';
import type { StudentDashboardDto } from '../../../lib/student';
import { TeacherModuleErrorState } from '../../teacher/shared';
import { studentHomeCopy } from './copy';
import { buildRecentActivityItems } from './metrics';
import {
  StudentAssignmentsPanel,
  StudentCalendarPreview,
  StudentCapabilityNotice,
  StudentCertificatesPanel,
  StudentCoursesPanel,
  StudentNotificationsPanel,
  StudentOverallProgress,
  StudentQuickLinks,
} from './student-home-panels';
import { StudentHomeSkeleton } from './student-home-skeleton';
import { StudentGreeting } from './student-greeting';
import { StudentSectionCard } from './student-section-card';
import { StudentStatGrid } from './student-stat-grid';

export function StudentHomeView(): React.JSX.Element {
  const { user } = useAuth();
  const { primaryOrganizationId } = useOrganization();
  const userId = user?.id ?? null;
  const welcomeName =
    user?.firstName !== undefined && user.firstName.trim().length > 0
      ? user.firstName.trim()
      : null;

  const [dashboard, setDashboard] = useState<StudentDashboardDto | null>(null);
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

    void StudentApi.getDashboard({
      organizationId: primaryOrganizationId,
      userId,
      welcomeName,
    })
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
  }, [primaryOrganizationId, requestVersion, userId, welcomeName]);

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  if (loading && dashboard === null) {
    return (
      <div className="space-y-8">
        <StudentGreeting welcomeName={welcomeName} />
        <StudentHomeSkeleton />
      </div>
    );
  }

  if (error || dashboard === null) {
    return (
      <div className="space-y-8">
        <StudentGreeting welcomeName={welcomeName} />
        <TeacherModuleErrorState
          title={studentHomeCopy.errorTitle}
          description={studentHomeCopy.errorDescription}
          retryLabel={studentHomeCopy.retryButton}
          onRetry={retry}
        />
      </div>
    );
  }

  const recentActivity = buildRecentActivityItems(dashboard.recentNotifications);

  return (
    <div className="space-y-8">
      <StudentGreeting welcomeName={dashboard.welcomeName ?? welcomeName} />

      <StudentStatGrid stats={dashboard.stats} />

      <div className="grid gap-4 laptop:grid-cols-2">
        <StudentSectionCard
          title={dashboard.todaysClasses.title}
          description={dashboard.todaysClasses.description}
          emptyLabel={dashboard.todaysClasses.emptyLabel}
          items={dashboard.todaysClasses.items}
        />
        <StudentSectionCard
          title={dashboard.upcomingLive.title}
          description={dashboard.upcomingLive.description}
          emptyLabel={dashboard.upcomingLive.emptyLabel}
          items={dashboard.upcomingLive.items}
        />
      </div>

      <div className="grid gap-4 laptop:grid-cols-2">
        <StudentOverallProgress courses={dashboard.currentCourses} />
        <StudentCoursesPanel courses={dashboard.currentCourses} />
      </div>

      <div className="grid gap-4 laptop:grid-cols-2">
        <StudentAssignmentsPanel assignments={dashboard.assignmentsDue} />
        <StudentCertificatesPanel certificates={dashboard.certificates} />
      </div>

      <div className="grid gap-4 laptop:grid-cols-2">
        <StudentNotificationsPanel notifications={dashboard.recentNotifications} />
        <StudentSectionCard
          title={studentHomeCopy.recentActivityTitle}
          description={studentHomeCopy.recentActivityDescription}
          emptyLabel={studentHomeCopy.recentActivityEmpty}
          items={recentActivity}
        />
      </div>

      <StudentCalendarPreview events={dashboard.calendarPreview} />
      <StudentQuickLinks />
      <StudentCapabilityNotice />
    </div>
  );
}
