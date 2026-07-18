import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import type { TeacherStatDto } from '../../../lib/teacher';

export function TeacherStatGrid({ stats }: { stats: TeacherStatDto[] }): React.JSX.Element {
  return (
    <section
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4"
      aria-label="Teaching statistics"
    >
      {stats.map((stat) => {
        const Icon = icons[stat.icon];
        return (
          <Card key={stat.id} className="rounded-xl shadow-sm">
            <CardHeader className="space-y-2 p-5 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription>{stat.label}</CardDescription>
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-2xl tracking-tight">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-caption text-muted-foreground">{stat.helper}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
