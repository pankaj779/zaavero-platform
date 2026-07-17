import { Badge, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import {
  accountStatusLabel,
  profilePageCopy,
  type StudentProfileDto,
} from '../../../lib/dashboard';

export function AccountStatusCard({ profile }: { profile: StudentProfileDto }): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="account-status-heading">
      <CardHeader>
        <CardTitle id="account-status-heading" className="text-base">
          {profilePageCopy.accountStatusTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Badge variant="success">{accountStatusLabel[profile.accountStatus]}</Badge>
        <p className="text-small text-muted-foreground">
          Account status is read-only until backend profile management is connected.
        </p>
      </CardContent>
    </Card>
  );
}
