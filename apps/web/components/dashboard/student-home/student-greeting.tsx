'use client';

import { Card, CardContent } from '@graphology/ui';
import { studentHomeCopy } from './copy';

export function StudentGreeting({
  welcomeName,
}: {
  welcomeName: string | null;
}): React.JSX.Element {
  const title =
    welcomeName && welcomeName.trim().length > 0
      ? studentHomeCopy.welcomeNamed(welcomeName.trim())
      : studentHomeCopy.welcomeFallback;

  return (
    <Card className="rounded-xl border-0 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="space-y-1">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {studentHomeCopy.portalLabel}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="max-w-2xl text-small text-muted-foreground">
            {studentHomeCopy.welcomeDescription}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
