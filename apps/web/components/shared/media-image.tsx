import { cn } from '@graphology/utils';

export function MediaImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}): React.JSX.Element {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      className={cn('object-cover', className)}
    />
  );
}
