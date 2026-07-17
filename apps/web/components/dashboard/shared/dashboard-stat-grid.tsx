import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';

export interface DashboardStatItem {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export function DashboardStatGrid({
  stats,
  ariaLabel,
}: {
  stats: DashboardStatItem[];
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <section
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4"
      aria-label={ariaLabel}
    >
      {stats.map((stat) => (
        <Card key={stat.id} className="rounded-xl shadow-sm">
          <CardHeader className="space-y-2 p-5 pb-2">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl tracking-tight">{stat.value}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-caption text-muted-foreground">{stat.helper}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
