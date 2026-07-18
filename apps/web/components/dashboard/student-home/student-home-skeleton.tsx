import { Skeleton } from '@graphology/ui';
import { studentHomeCopy } from './copy';

export function StudentHomeSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={studentHomeCopy.loadingLabel}>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 laptop:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
