import { Badge } from '@graphology/ui';
import { cn } from '@graphology/utils';
import { icons } from '../../../lib/constants';
import {
  courseDetailsCopy,
  lessonStatusLabel,
  type LessonProgressStatus,
} from '../../../lib/dashboard';

const LockIcon = icons.lock;
const CheckIcon = icons.check;
const PlayIcon = icons.play;

export function LessonStatus({ status }: { status: LessonProgressStatus }): React.JSX.Element {
  const variant =
    status === 'completed'
      ? 'success'
      : status === 'current'
        ? 'primary'
        : status === 'locked'
          ? 'neutral'
          : 'secondary';

  const Icon =
    status === 'locked' ? LockIcon : status === 'completed' ? CheckIcon : PlayIcon;

  return (
    <Badge
      variant={variant}
      className={cn('inline-flex items-center gap-1')}
      aria-label={
        status === 'current'
          ? courseDetailsCopy.currentLessonHint
          : status === 'locked'
            ? courseDetailsCopy.lockedLessonHint
            : lessonStatusLabel[status]
      }
    >
      <Icon className="h-3 w-3" aria-hidden />
      {lessonStatusLabel[status]}
    </Badge>
  );
}
