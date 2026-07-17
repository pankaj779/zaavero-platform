import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import {
  formatProfileDate,
  getLanguageLabel,
  profilePageCopy,
  type StudentProfileDto,
} from '../../../lib/dashboard';

export function PersonalInformation({
  profile,
}: {
  profile: StudentProfileDto;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="personal-info-heading">
      <CardHeader>
        <CardTitle id="personal-info-heading" className="text-base">
          {profilePageCopy.personalTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 tablet:grid-cols-2">
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.firstNameLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{profile.firstName}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.lastNameLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{profile.lastName}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.emailLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.phoneLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {profile.phone ?? profilePageCopy.phonePlaceholder}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.languageLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {getLanguageLabel(profile.language)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.timezoneLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{profile.timezone}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.joinedLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {formatProfileDate(profile.joinedAt)}
            </dd>
          </div>
          <div className="tablet:col-span-2">
            <dt className="text-caption text-muted-foreground">{profilePageCopy.bioLabel}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground">{profile.bio}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
