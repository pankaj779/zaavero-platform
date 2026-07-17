import { Card, CardContent, Skeleton } from '@graphology/ui';

function CourseCardSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="aspect-[16/10] w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
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
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CoursesSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading Courses">
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
          <CourseCardSkeleton key={`course-skeleton-${String(index)}`} />
        ))}
      </div>
    </div>
  );
}
