import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  teacherAnalyticsPageCopy,
  type TeacherAnalyticsChartType,
  type TeacherAnalyticsSectionDto,
} from '../../../lib/teacher';

function ChartGlyph({
  chartType,
}: {
  chartType: TeacherAnalyticsChartType;
}): React.JSX.Element {
  if (chartType === 'line') {
    return (
      <svg viewBox="0 0 120 64" className="h-16 w-full text-muted-foreground" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points="8,48 32,36 56,40 80,20 112,28"
        />
      </svg>
    );
  }

  if (chartType === 'area') {
    return (
      <svg viewBox="0 0 120 64" className="h-16 w-full text-muted-foreground" aria-hidden>
        <path
          fill="currentColor"
          fillOpacity="0.15"
          d="M8,52 L32,36 L56,40 L80,20 L112,28 L112,52 Z"
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points="8,52 32,36 56,40 80,20 112,28"
        />
      </svg>
    );
  }

  if (chartType === 'pie') {
    return (
      <svg viewBox="0 0 120 64" className="h-16 w-full text-muted-foreground" aria-hidden>
        <circle cx="60" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M60,32 L60,10 A22,22 0 0,1 80,44 Z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 64" className="h-16 w-full text-muted-foreground" aria-hidden>
      <rect x="16" y="28" width="14" height="24" fill="currentColor" fillOpacity="0.25" />
      <rect x="40" y="16" width="14" height="36" fill="currentColor" fillOpacity="0.35" />
      <rect x="64" y="22" width="14" height="30" fill="currentColor" fillOpacity="0.25" />
      <rect x="88" y="12" width="14" height="40" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

/**
 * Reusable chart placeholder — declares the future chart type without a chart library.
 */
export function AnalyticsChartPlaceholder({
  section,
  courseTitle,
  selected = false,
  onSelect,
}: {
  section: TeacherAnalyticsSectionDto;
  courseTitle?: string | null;
  selected?: boolean;
  onSelect?: (metricId: string) => void;
}): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;

  return (
    <Card
      className={cn(
        'flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md',
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
    >
      <CardHeader className="space-y-2 p-5 pb-0">
        <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
          {section.chartTypeLabel}
        </p>
        <CardTitle className="text-base leading-snug">{section.title}</CardTitle>
        <p className="text-small text-muted-foreground">{section.description}</p>
        {courseTitle ? (
          <p className="text-caption text-muted-foreground">{`Course: ${courseTitle}`}</p>
        ) : (
          <p className="text-caption text-muted-foreground">Course: All courses</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6"
          role="img"
          aria-label={`${section.chartTypeLabel} placeholder for ${section.title}`}
        >
          <div className="w-full max-w-xs space-y-2 text-center">
            <ChartGlyph chartType={section.chartType} />
            <p className="text-caption text-muted-foreground">{copy.chartPlaceholderNote}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={`${copy.detailsButton} — ${section.title}`}
          onClick={() => {
            onSelect?.(section.metricId);
          }}
        >
          {copy.detailsButton}
        </Button>
      </CardContent>
    </Card>
  );
}
