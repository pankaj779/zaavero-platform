import { Button } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { learningPageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const BookIcon = icons.book;

export function LearningEmptyState(): React.JSX.Element {
  return (
    <div>
      <DashboardEmptyState
        title={learningPageCopy.emptyTitle}
        description={learningPageCopy.emptyDescription}
        illustration={<BookIcon className="h-7 w-7" aria-hidden />}
      />
      <div className="-mt-2 flex justify-center pb-8">
        <Button type="button" variant="primary" size="md" disabled>
          {learningPageCopy.emptyCtaLabel}
        </Button>
      </div>
    </div>
  );
}
