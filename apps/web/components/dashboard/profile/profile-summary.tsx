import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  accountStatusLabel,
  getStudentDisplayName,
  profilePageCopy,
  type StudentProfileDto,
} from '../../../lib/dashboard';

const UserIcon = icons.user;

export function ProfileSummary({ profile }: { profile: StudentProfileDto }): React.JSX.Element {
  return (
    <aside aria-label={profilePageCopy.summaryLabel}>
      <Card className="rounded-xl shadow-sm laptop:sticky laptop:top-20">
        <CardHeader className="items-center space-y-4 text-center">
          <span
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-foreground"
            role="img"
            aria-label={profilePageCopy.avatarAlt}
          >
            <UserIcon className="h-8 w-8" aria-hidden />
          </span>
          <div className="space-y-2">
            <CardTitle className="text-xl">{getStudentDisplayName(profile)}</CardTitle>
            <p className="text-small text-muted-foreground">{profile.email}</p>
            <Badge variant="success">{accountStatusLabel[profile.accountStatus]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" variant="primary" size="md" className="w-full" disabled>
            {profilePageCopy.editProfile}
          </Button>
          <Badge variant="neutral" className="w-full justify-center">
            {profilePageCopy.comingSoon}
          </Badge>
        </CardContent>
      </Card>
    </aside>
  );
}
