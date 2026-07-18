import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { teacherSettingsPageCopy, type TeacherConnectedAccountDto } from '../../../lib/teacher';

export function ConnectedAccountsSection({
  accounts,
}: {
  accounts: TeacherConnectedAccountDto[];
}): React.JSX.Element {
  const copy = teacherSettingsPageCopy;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-connected-accounts-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="teacher-connected-accounts-heading" className="text-base">
          {copy.connectedTitle}
        </CardTitle>
        <CardDescription>{copy.connectedDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{account.label}</p>
              <p className="text-caption text-muted-foreground">
                {account.connected ? copy.connected : copy.notConnected}
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 tablet:items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                aria-label={`${account.connected ? copy.disconnect : copy.connect} ${account.label} — ${copy.comingSoonNote}`}
              >
                {account.connected ? copy.disconnect : copy.connect}
              </Button>
              <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
