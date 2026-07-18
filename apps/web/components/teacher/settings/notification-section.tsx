'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
} from '@graphology/ui';
import { useMemo, useState } from 'react';
import {
  teacherSettingsPageCopy,
  type TeacherNotificationPreferencesDto,
} from '../../../lib/teacher';

export function NotificationSection({
  initialPreferences,
}: {
  initialPreferences: TeacherNotificationPreferencesDto;
}): React.JSX.Element {
  const copy = teacherSettingsPageCopy;
  const [prefs, setPrefs] = useState(initialPreferences);

  const items = useMemo(
    () =>
      [
        { key: 'emailNotifications' as const, label: copy.emailNotifications },
        { key: 'assignmentReviews' as const, label: copy.assignmentReviews },
        { key: 'liveClassReminders' as const, label: copy.liveClassReminders },
        { key: 'studentMessages' as const, label: copy.studentMessages },
        { key: 'marketingEmails' as const, label: copy.marketingEmails },
      ] as const,
    [copy],
  );

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-notifications-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="teacher-notifications-heading" className="text-base">
          {copy.notificationsTitle}
        </CardTitle>
        <CardDescription>{copy.notificationsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3"
          >
            <Label htmlFor={`teacher-notify-${item.key}`} className="text-sm text-foreground">
              {item.label}
            </Label>
            <Switch
              id={`teacher-notify-${item.key}`}
              checked={prefs[item.key]}
              onCheckedChange={(checked) => {
                setPrefs((current) => ({ ...current, [item.key]: checked }));
              }}
              aria-label={item.label}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
