import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { profilePageCopy, type StudentProfileDto } from '../../../lib/dashboard';

export function OrganizationCard({ profile }: { profile: StudentProfileDto }): React.JSX.Element {
  const { organization } = profile;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="organization-heading">
      <CardHeader>
        <CardTitle id="organization-heading" className="text-base">
          {profilePageCopy.organizationTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 tablet:grid-cols-2">
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.orgNameLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{organization.name}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.roleLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{organization.role}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
