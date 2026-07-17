import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import {
  settingsPageCopy,
  type ConnectedAccountDto,
} from '../../../lib/dashboard';

export function ConnectedAccountsSection({
  accounts,
}: {
  accounts: ConnectedAccountDto[];
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="connected-accounts-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="connected-accounts-heading" className="text-base">
          {settingsPageCopy.connectedTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.connectedDescription}</CardDescription>
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
                {account.connected
                  ? settingsPageCopy.connected
                  : settingsPageCopy.notConnected}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{settingsPageCopy.comingSoon}</Badge>
              <Button type="button" variant="outline" size="sm" disabled>
                {account.connected ? settingsPageCopy.disconnect : settingsPageCopy.connect}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
