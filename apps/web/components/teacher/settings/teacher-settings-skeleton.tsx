import { Card, CardContent, Skeleton } from '@graphology/ui';

export function TeacherSettingsSkeleton(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-3xl gap-4" aria-busy="true" aria-label="Loading Settings">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={`settings-skel-${String(index)}`} className="rounded-xl shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
