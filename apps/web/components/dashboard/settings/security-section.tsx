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

export function SecuritySection(): React.JSX.Element {
  const actions = [
    settingsPageCopy.changePassword,
    settingsPageCopy.twoFactor,
    settingsPageCopy.activeSessions,
  ];

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="security-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="security-heading" className="text-base">
          {settingsPageCopy.securityTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.securityDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((label) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between"
          >
            <p className="text-sm font-medium text-foreground">{label}</p>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{settingsPageCopy.comingSoon}</Badge>
              <Button type="button" variant="outline" size="sm" disabled>
                {label}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
