import { Card, CardContent } from '@graphology/ui';
import { teacherGreetingPlaceholder, teacherProfilePlaceholder } from '../../../lib/teacher';
import { ComingSoonBadge } from '../shared';

export function TeacherGreeting(): React.JSX.Element {
  const greeting = teacherGreetingPlaceholder;
  const profile = teacherProfilePlaceholder;

  return (
    <Card className="rounded-xl border-0 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="space-y-1">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {greeting.eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting.title}, {profile.name}
          </h1>
          <p className="max-w-2xl text-small text-muted-foreground">{greeting.subtitle}</p>
        </div>
        <ComingSoonBadge label="Preview" />
      </CardContent>
    </Card>
  );
}
