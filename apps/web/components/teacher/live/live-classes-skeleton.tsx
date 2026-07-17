import { Card, CardContent, Skeleton } from '@graphology/ui';

function LiveClassCardSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`live-class-detail-${String(index)}`} className="h-4 w-full" />
        ))}
        <div className="grid gap-2 tablet:grid-cols-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function LiveClassesSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading Live Classes">
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`live-class-stat-${String(index)}`}
            className="h-28 w-full rounded-xl"
          />
        ))}
      </div>
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Skeleton className="h-10 w-full tablet:col-span-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <LiveClassCardSkeleton key={`live-class-card-${String(index)}`} />
        ))}
      </div>
    </div>
  );
}
