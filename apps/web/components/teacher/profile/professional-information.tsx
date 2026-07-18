import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { teacherProfilePageCopy, type TeacherProfileDto } from '../../../lib/teacher';

export function ProfessionalInformation({
  profile,
}: {
  profile: TeacherProfileDto;
}): React.JSX.Element {
  const copy = teacherProfilePageCopy;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-professional-info-heading">
      <CardHeader>
        <CardTitle id="teacher-professional-info-heading" className="text-base">
          {copy.professionalTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-caption text-muted-foreground">{copy.qualificationsLabel}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {profile.qualifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-caption text-muted-foreground">{copy.experienceLabel}</h3>
          <p className="mt-1 text-sm font-medium text-foreground">
            {String(profile.experienceYears)} {copy.yearsSuffix}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
