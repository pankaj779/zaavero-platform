import { Skeleton } from '@graphology/ui';

export function LessonSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading lesson">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-2/3 max-w-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_minmax(16rem,30%)]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="hidden h-[28rem] w-full rounded-xl laptop:block" />
      </div>
    </div>
  );
}
