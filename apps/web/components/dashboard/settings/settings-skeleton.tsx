import { Skeleton } from '@graphology/ui';

export function SettingsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
