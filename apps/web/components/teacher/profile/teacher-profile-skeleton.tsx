import { Card, CardContent, Skeleton } from '@graphology/ui';

export function TeacherProfileSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-6 laptop:grid-cols-[18rem_minmax(0,1fr)]"
      aria-busy="true"
      aria-label="Loading Profile"
    >
      <Card className="rounded-xl shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`profile-skel-${String(index)}`} className="rounded-xl shadow-sm">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
