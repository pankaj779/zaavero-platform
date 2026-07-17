import { Card, CardContent, Skeleton } from '@graphology/ui';

export function CalendarSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-4 laptop:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,18rem)]"
      aria-busy="true"
      aria-label="Loading Calendar"
    >
      <Card className="hidden rounded-xl shadow-sm laptop:block">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <Skeleton key={`cal-day-${String(index)}`} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
