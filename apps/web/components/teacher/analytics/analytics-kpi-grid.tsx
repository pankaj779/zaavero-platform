import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import { teacherAnalyticsPageCopy, type TeacherAnalyticsMetricDto } from '../../../lib/teacher';

/**
 * Selectable KPI cards for the analytics overview.
 * Values are placeholders; selecting a card opens the shared details panel.
 */
export function AnalyticsKpiGrid({
  kpis,
  selectedMetricId,
  onSelect,
}: {
  kpis: TeacherAnalyticsMetricDto[];
  selectedMetricId?: string | null;
  onSelect?: (metricId: string) => void;
}): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;

  return (
    <section
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={copy.kpiLabel}
    >
      {kpis.map((kpi) => {
        const selected = kpi.id === selectedMetricId;

        return (
          <Card
            key={kpi.id}
            className={cn(
              'rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md',
              selected ? 'ring-2 ring-primary ring-offset-2' : '',
            )}
          >
            <CardHeader className="space-y-2 p-5 pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-2xl tracking-tight">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-5 pt-0">
              <p className="text-caption text-muted-foreground">{kpi.helper}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`${copy.detailsButton} — ${kpi.label}`}
                onClick={() => {
                  onSelect?.(kpi.id);
                }}
              >
                {copy.detailsButton}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
