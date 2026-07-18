import { Card, CardContent, Skeleton } from '@graphology/ui';

function LessonCardSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function LessonsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading Lessons">
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`stat-skeleton-${String(index)}`} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Skeleton className="h-10 w-full tablet:col-span-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <LessonCardSkeleton key={`lesson-skeleton-${String(index)}`} />
        ))}
      </div>
    </div>
  );
}
