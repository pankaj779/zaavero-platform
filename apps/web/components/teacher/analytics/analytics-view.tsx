'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnalyticsApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  buildTeacherAnalyticsOverview,
  type TeacherAnalyticsSourceDto,
  type TeacherAnalyticsTimeRange,
} from '../../../lib/teacher';
import { AnalyticsEmptyState } from './analytics-empty-state';
import { AnalyticsErrorState } from './analytics-error-state';
import { AnalyticsHeader } from './analytics-header';
import { AnalyticsSkeleton } from './analytics-skeleton';
import { AnalyticsWorkspace } from './analytics-workspace';

/** Loads organization-scoped analytics through the API layer. */
export function AnalyticsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [source, setSource] = useState<TeacherAnalyticsSourceDto | null>(null);
  const [timeRange, setTimeRange] = useState<TeacherAnalyticsTimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (primaryOrganizationId === null) {
      setSource(null);
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    void AnalyticsApi.getSource(primaryOrganizationId)
      .then((nextSource) => {
        if (requestId === requestIdRef.current) {
          setSource(nextSource);
          setError(false);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setSource(null);
          setError(true);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [primaryOrganizationId, requestVersion]);

  const overview = useMemo(
    () => (source === null ? null : buildTeacherAnalyticsOverview(source, timeRange)),
    [source, timeRange],
  );
  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  if (loading && source === null) {
    return (
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (error || source === null || overview === null) {
    return (
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsErrorState onRetry={retry} />
      </div>
    );
  }

  if (
    source.courses.length === 0 &&
    source.students.length === 0 &&
    source.assignments.length === 0 &&
    source.submissions.length === 0 &&
    source.attendanceSessions.length === 0 &&
    source.liveSessions.length === 0 &&
    source.certificates.length === 0
  ) {
    return (
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnalyticsHeader />
      <AnalyticsWorkspace
        kpis={overview.kpis}
        sections={overview.sections}
        courses={overview.courses}
        metrics={overview.metrics}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
  );
}
