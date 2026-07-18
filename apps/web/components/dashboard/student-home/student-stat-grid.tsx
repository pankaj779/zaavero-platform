import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import type { StudentDashboardStatDto } from '../../../lib/student';
import { studentHomeCopy } from './copy';
import { mapDashboardStatsForDisplay } from './metrics';

export function StudentStatGrid({
  stats,
}: {
  stats: StudentDashboardStatDto[];
}): React.JSX.Element {
  const displayStats = mapDashboardStatsForDisplay(stats);

  return (
    <section
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={studentHomeCopy.statsAriaLabel}
    >
      {displayStats.map((stat) => (
        <Card key={stat.id} className="rounded-xl shadow-sm">
          <CardHeader className="space-y-2 p-5 pb-2">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl tracking-tight">{stat.displayValue}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-caption text-muted-foreground">{stat.helper}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
