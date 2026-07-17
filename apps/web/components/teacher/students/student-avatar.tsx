import { cn } from '@graphology/utils';
import { teacherStudentsPageCopy } from '../../../lib/teacher';

export function StudentAvatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-sm font-semibold text-muted-foreground',
        className,
      )}
      role="img"
      aria-label={teacherStudentsPageCopy.avatarAlt}
    >
      {initials}
    </span>
  );
}
