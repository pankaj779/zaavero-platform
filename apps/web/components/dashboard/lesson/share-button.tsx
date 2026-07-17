'use client';

import { Button } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { lessonPlayerCopy } from '../../../lib/dashboard';

const ShareIcon = icons.share;

export function ShareButton(): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      aria-label={lessonPlayerCopy.share}
      title="Sharing will be available later"
    >
      <ShareIcon className="h-4 w-4" aria-hidden />
      <span className="hidden tablet:inline">{lessonPlayerCopy.share}</span>
    </Button>
  );
}
