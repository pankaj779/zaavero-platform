import {
  teacherAnalyticsOverview,
  teacherAnalyticsViewState,
  type TeacherAnalyticsOverviewDto,
  type TeacherAnalyticsViewState,
} from '../../../lib/teacher';
import { AnalyticsEmptyState } from './analytics-empty-state';
import { AnalyticsErrorState } from './analytics-error-state';
import { AnalyticsHeader } from './analytics-header';
import { AnalyticsSkeleton } from './analytics-skeleton';
import { AnalyticsWorkspace } from './analytics-workspace';

/** Server-renderable analytics shell; interactivity lives in AnalyticsWorkspace. */
export function AnalyticsView({
  overview = teacherAnalyticsOverview,
  viewState = teacherAnalyticsViewState,
}: {
  overview?: TeacherAnalyticsOverviewDto;
  viewState?: TeacherAnalyticsViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsErrorState />
      </div>
    );
  }

  if (
    viewState === 'empty' ||
    (overview.kpis.length === 0 && overview.sections.length === 0)
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
        defaultTimeRange={overview.timeRange}
      />
    </div>
  );
}
