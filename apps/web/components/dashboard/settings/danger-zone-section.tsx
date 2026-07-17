import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import { settingsPageCopy } from '../../../lib/dashboard';

export function DangerZoneSection(): React.JSX.Element {
  return (
    <Card
      className="rounded-xl border-danger/30 shadow-sm"
      aria-labelledby="danger-zone-heading"
    >
      <CardHeader className="space-y-2">
        <CardTitle id="danger-zone-heading" className="text-base text-danger">
          {settingsPageCopy.dangerTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.dangerDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[settingsPageCopy.deactivateAccount, settingsPageCopy.deleteAccount].map((label) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between"
          >
            <p className="text-sm font-medium text-foreground">{label}</p>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{settingsPageCopy.comingSoon}</Badge>
              <Button type="button" variant="danger" size="sm" disabled>
                {label}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
