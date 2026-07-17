import { Skeleton } from '@graphology/ui';

export function LiveSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading live classes">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-4 tablet:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 laptop:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
