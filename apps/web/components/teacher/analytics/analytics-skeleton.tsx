import { Card, CardContent, Skeleton } from '@graphology/ui';

function ChartPlaceholderSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function AnalyticsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading Analytics">
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`analytics-kpi-${String(index)}`} className="h-36 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Skeleton className="h-10 w-full tablet:col-span-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ChartPlaceholderSkeleton key={`analytics-section-${String(index)}`} />
        ))}
      </div>
    </div>
  );
}
