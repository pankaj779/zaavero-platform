import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import type { StudentProfileDto } from '../../../lib/student';
import { studentProfileCopy } from './copy';
import { getStudentDisplayName } from './profile-display';
import { AvatarUpload } from '../../shared/avatar-upload';

const UserIcon = icons.user;

export function StudentProfileSummary({
  profile,
  organizationId,
}: {
  profile: StudentProfileDto;
  organizationId: string;
}): React.JSX.Element {
  const primaryRole = profile.roles[0] ?? 'Student';

  return (
    <aside aria-label={studentProfileCopy.summaryLabel}>
      <Card className="rounded-xl shadow-sm laptop:sticky laptop:top-20">
        <CardHeader className="items-center space-y-4 text-center">
          <span
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-foreground"
            role="img"
            aria-label={studentProfileCopy.avatarAlt}
          >
            <UserIcon className="h-8 w-8" aria-hidden />
          </span>
          <div className="space-y-2">
            <CardTitle className="text-xl">{getStudentDisplayName(profile)}</CardTitle>
            <p className="text-small text-muted-foreground">{profile.email}</p>
            <Badge variant="success">
              {studentProfileCopy.roleLabel}: {primaryRole}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            disabled
            aria-label={`${studentProfileCopy.editProfile} — ${studentProfileCopy.unavailableNote}`}
          >
            {studentProfileCopy.editProfile}
          </Button>
          <AvatarUpload
            organizationId={organizationId}
            userId={profile.id}
            initialUrl={profile.avatarUrl}
            alt={studentProfileCopy.avatarAlt}
          />
        </CardContent>
      </Card>
    </aside>
  );
}
