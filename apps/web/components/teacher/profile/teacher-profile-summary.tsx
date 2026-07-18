import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  getTeacherDisplayName,
  teacherProfilePageCopy,
  type TeacherProfileDto,
} from '../../../lib/teacher';
import { AvatarUpload } from '../../shared/avatar-upload';

const UserIcon = icons.user;

export function TeacherProfileSummary({
  profile,
  organizationId,
}: {
  profile: TeacherProfileDto;
  organizationId: string;
}): React.JSX.Element {
  const copy = teacherProfilePageCopy;

  return (
    <aside aria-label={copy.summaryLabel}>
      <Card className="rounded-xl shadow-sm laptop:sticky laptop:top-20">
        <CardHeader className="items-center space-y-4 text-center">
          <span
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-foreground"
            role="img"
            aria-label={copy.avatarAlt}
          >
            <UserIcon className="h-8 w-8" aria-hidden />
          </span>
          <div className="space-y-2">
            <CardTitle className="text-xl">{getTeacherDisplayName(profile)}</CardTitle>
            <p className="text-small text-muted-foreground">{profile.email}</p>
            <Badge variant="success">{copy.roleLabel}: Teacher</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            disabled
            aria-label={`${copy.editProfile} — ${copy.comingSoonNote}`}
          >
            {copy.editProfile}
          </Button>
          <AvatarUpload
            organizationId={organizationId}
            userId={profile.id}
            initialUrl={profile.avatarUrl}
            alt={copy.avatarAlt}
          />
        </CardContent>
      </Card>
    </aside>
  );
}
