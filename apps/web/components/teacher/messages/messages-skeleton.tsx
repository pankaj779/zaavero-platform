import { Card, CardContent, Skeleton } from '@graphology/ui';

export function MessagesSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-4 laptop:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,16rem)]"
      aria-busy="true"
      aria-label="Loading Messages"
    >
      <Card className="rounded-xl shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`message-conv-${String(index)}`} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 w-3/4 rounded-xl" />
          <Skeleton className="h-20 w-2/3 rounded-xl ml-auto" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <Card className="hidden rounded-xl shadow-sm laptop:block">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
