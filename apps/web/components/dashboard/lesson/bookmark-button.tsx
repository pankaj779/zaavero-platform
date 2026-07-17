'use client';

import { Button } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { lessonPlayerCopy } from '../../../lib/dashboard';

const BookmarkIcon = icons.bookmark;

export function BookmarkButton({
  isBookmarked = false,
}: {
  isBookmarked?: boolean;
}): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? lessonPlayerCopy.bookmarked : lessonPlayerCopy.bookmark}
      title="Bookmarking will be available later"
    >
      <BookmarkIcon className="h-4 w-4" aria-hidden />
      <span className="hidden tablet:inline">
        {isBookmarked ? lessonPlayerCopy.bookmarked : lessonPlayerCopy.bookmark}
      </span>
    </Button>
  );
}
