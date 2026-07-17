import { icons } from '../../../lib/constants';
import { teacherAnalyticsPageCopy } from '../../../lib/teacher';
import { DashboardEmptyState } from '../../dashboard/shared';

const TrendingIcon = icons.trending;

export function AnalyticsEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <DashboardEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      illustration={<TrendingIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
