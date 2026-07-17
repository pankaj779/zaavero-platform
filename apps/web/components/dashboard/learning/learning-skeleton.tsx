import { Card, CardContent, CardHeader, Skeleton } from '@graphology/ui';

function WidgetSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

function CourseCardSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="aspect-[16/10] w-full rounded-lg" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-2 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function LearningSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading My Learning">
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Skeleton className="h-10 w-full tablet:col-span-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <WidgetSkeleton key={`widget-skeleton-${String(index)}`} />
        ))}
      </div>

      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CourseCardSkeleton key={`course-skeleton-${String(index)}`} />
        ))}
      </div>
    </div>
  );
}
