import { cn } from '@graphology/utils';
import { icons } from '../../../lib/constants';
import { MediaImage } from '../../shared/media-image';

const BookIcon = icons.book;

export function CourseThumbnail({
  label,
  src,
  className,
}: {
  label: string;
  src?: string | null;
  className?: string;
}): React.JSX.Element {
  if (src) {
    return (
      <MediaImage
        src={src}
        alt={label}
        sizes="(min-width: 1024px) 224px, 100vw"
        className={cn('aspect-[16/10] w-full rounded-lg', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40',
        className,
      )}
      role="img"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
          <BookIcon className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-caption text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
