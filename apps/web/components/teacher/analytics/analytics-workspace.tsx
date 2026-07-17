'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherAnalyticsSections,
  getTeacherAnalyticsMetricById,
  teacherAnalyticsPageCopy,
  type TeacherAnalyticsCourseRefDto,
  type TeacherAnalyticsMetricDto,
  type TeacherAnalyticsSectionDto,
  type TeacherAnalyticsTimeRange,
} from '../../../lib/teacher';
import { AnalyticsActions } from './analytics-actions';
import { AnalyticsDetailsPanel } from './analytics-details-panel';
import { AnalyticsEmptyState } from './analytics-empty-state';
import { AnalyticsKpiGrid } from './analytics-kpi-grid';
import { AnalyticsSearch } from './analytics-search';
import { AnalyticsSectionCollection } from './analytics-section-collection';
import { AnalyticsTimeRangeFilter } from './analytics-time-range-filter';

/** Client boundary for search, time-range filter, and selected metric. */
export function AnalyticsWorkspace({
  kpis,
  sections,
  courses,
  metrics,
  defaultTimeRange = '30d',
}: {
  kpis: TeacherAnalyticsMetricDto[];
  sections: TeacherAnalyticsSectionDto[];
  courses: TeacherAnalyticsCourseRefDto[];
  metrics: TeacherAnalyticsMetricDto[];
  defaultTimeRange?: TeacherAnalyticsTimeRange;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TeacherAnalyticsTimeRange>(defaultTimeRange);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const copy = teacherAnalyticsPageCopy;

  const visibleSections = useMemo(
    () => filterTeacherAnalyticsSections(sections, courses, query),
    [sections, courses, query],
  );

  const selectedMetric = useMemo(
    () =>
      selectedMetricId === null
        ? null
        : getTeacherAnalyticsMetricById(metrics, selectedMetricId),
    [metrics, selectedMetricId],
  );

  return (
    <div className="space-y-8">
      <AnalyticsActions />

      <section className="space-y-4" aria-label="Analytics filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-end">
          <div className="w-full laptop:max-w-sm">
            <AnalyticsSearch value={query} onChange={setQuery} />
          </div>
          <AnalyticsTimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>
        <p className="text-caption text-muted-foreground">
          {`${copy.timeRangeNote} Selected range: ${timeRange}.`}
        </p>
      </section>

      {selectedMetric ? (
        <AnalyticsDetailsPanel
          metric={selectedMetric}
          onClose={() => {
            setSelectedMetricId(null);
          }}
        />
      ) : null}

      <AnalyticsKpiGrid
        kpis={kpis}
        selectedMetricId={selectedMetricId}
        onSelect={setSelectedMetricId}
      />

      {visibleSections.length === 0 ? (
        <AnalyticsEmptyState variant="no-matches" />
      ) : (
        <AnalyticsSectionCollection
          sections={visibleSections}
          courses={courses}
          selectedMetricId={selectedMetricId}
          onSelect={setSelectedMetricId}
        />
      )}
    </div>
  );
}
