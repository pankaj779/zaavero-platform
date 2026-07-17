import { icons } from '../../../lib/constants';
import { DashboardEmptyState } from '../../dashboard/shared';
import { teacherCoursesPageCopy } from '../../../lib/teacher';

const BookIcon = icons.book;

export function CoursesEmptyState({
  variant = 'empty',
}: {
  /** `empty` — no courses at all; `no-matches` — filters returned nothing. */
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherCoursesPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <DashboardEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      illustration={<BookIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
