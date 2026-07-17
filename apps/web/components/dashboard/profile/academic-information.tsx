import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { profilePageCopy, type StudentProfileDto } from '../../../lib/dashboard';

export function AcademicInformation({
  profile,
}: {
  profile: StudentProfileDto;
}): React.JSX.Element {
  const { academic } = profile;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="academic-info-heading">
      <CardHeader>
        <CardTitle id="academic-info-heading" className="text-base">
          {profilePageCopy.academicTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4">
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.enrolledLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {academic.enrolledProgramsLabel}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.levelLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {academic.learnerLevelLabel}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{profilePageCopy.goalLabel}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {academic.learningGoalPlaceholder}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
