import { icons } from '../../../lib/constants';
import { livePageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const VideoIcon = icons.video;

export function LiveEmptyState(): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={livePageCopy.emptyTitle}
      description={livePageCopy.emptyDescription}
      illustration={<VideoIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
