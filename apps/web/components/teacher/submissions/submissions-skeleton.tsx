import { Card, CardContent, Skeleton } from '@graphology/ui';

function SubmissionCardSkeleton(): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`submission-detail-${String(index)}`} className="h-4 w-full" />
        ))}
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function SubmissionsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading Submissions">
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`submission-stat-${String(index)}`} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Skeleton className="h-10 w-full tablet:col-span-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SubmissionCardSkeleton key={`submission-card-${String(index)}`} />
        ))}
      </div>
    </div>
  );
}
