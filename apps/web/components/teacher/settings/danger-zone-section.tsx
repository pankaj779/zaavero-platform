import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { teacherSettingsPageCopy } from '../../../lib/teacher';

export function DangerZoneSection(): React.JSX.Element {
  const copy = teacherSettingsPageCopy;
  const actions = [copy.deactivateAccount, copy.deleteAccount];

  return (
    <Card
      className="rounded-xl border-danger/30 shadow-sm"
      aria-labelledby="teacher-danger-zone-heading"
    >
      <CardHeader className="space-y-2">
        <CardTitle id="teacher-danger-zone-heading" className="text-base text-danger">
          {copy.dangerTitle}
        </CardTitle>
        <CardDescription>{copy.dangerDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((label) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between"
          >
            <p className="text-sm font-medium text-foreground">{label}</p>
            <div className="flex flex-col items-start gap-1 tablet:items-end">
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled
                aria-label={`${label} — ${copy.comingSoonNote}`}
              >
                {label}
              </Button>
              <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
