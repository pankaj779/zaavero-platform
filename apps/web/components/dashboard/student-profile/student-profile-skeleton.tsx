import { Skeleton } from '@graphology/ui';
import { studentProfileCopy } from './copy';

export function StudentProfileSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-6 laptop:grid-cols-[18rem_minmax(0,1fr)]"
      aria-busy="true"
      aria-label={studentProfileCopy.loadingLabel}
    >
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
