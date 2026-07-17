import { Skeleton } from '@graphology/ui';

export function ProfileSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-6 laptop:grid-cols-[18rem_minmax(0,1fr)]"
      aria-busy="true"
      aria-label="Loading profile"
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
