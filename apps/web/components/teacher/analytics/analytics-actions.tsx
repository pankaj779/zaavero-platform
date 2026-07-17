import { Button } from '@graphology/ui';
import { teacherAnalyticsPageCopy } from '../../../lib/teacher';

/** Disabled report actions — export/email/compare arrive in a later sprint. */
export function AnalyticsActions(): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;
  const actions = [
    { id: 'export', label: copy.exportButton },
    { id: 'pdf', label: copy.downloadPdfButton },
    { id: 'email', label: copy.emailReportButton },
    { id: 'compare', label: copy.comparePeriodsButton },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid gap-2 tablet:grid-cols-2 laptop:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label={`${action.label} — coming soon`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}
