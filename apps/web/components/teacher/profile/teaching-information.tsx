import { Badge, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { teacherProfilePageCopy, type TeacherProfileDto } from '../../../lib/teacher';

export function TeachingInformation({
  profile,
}: {
  profile: TeacherProfileDto;
}): React.JSX.Element {
  const copy = teacherProfilePageCopy;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-teaching-info-heading">
      <CardHeader>
        <CardTitle id="teacher-teaching-info-heading" className="text-base">
          {copy.teachingTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-caption text-muted-foreground">{copy.specializationsLabel}</h3>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={copy.specializationsLabel}>
          {profile.specializations.map((item) => (
            <li key={item}>
              <Badge variant="secondary">{item}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
