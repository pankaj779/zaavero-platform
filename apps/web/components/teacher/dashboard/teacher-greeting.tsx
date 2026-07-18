'use client';

import { Card, CardContent } from '@graphology/ui';
import { useAuth } from '../../../lib/auth';

export function TeacherGreeting(): React.JSX.Element {
  const { user } = useAuth();
  const firstName = user?.firstName.trim() ?? '';
  const name = firstName.length > 0 ? firstName : 'Teacher';

  return (
    <Card className="rounded-xl border-0 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="space-y-1">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Teacher Portal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back, {name}
          </h1>
          <p className="max-w-2xl text-small text-muted-foreground">
            Review your courses, learners, sessions, and work requiring attention.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
