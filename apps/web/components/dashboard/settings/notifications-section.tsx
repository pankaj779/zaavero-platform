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
  settingsPageCopy,
  type NotificationPreferencesDto,
} from '../../../lib/dashboard';

export function NotificationsSection({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferencesDto;
}): React.JSX.Element {
  const [prefs, setPrefs] = useState(initialPreferences);

  const items = useMemo(
    () =>
      [
        {
          key: 'emailNotifications' as const,
          label: settingsPageCopy.emailNotifications,
        },
        {
          key: 'assignmentReminders' as const,
          label: settingsPageCopy.assignmentReminders,
        },
        {
          key: 'liveClassReminders' as const,
          label: settingsPageCopy.liveClassReminders,
        },
        {
          key: 'marketingEmails' as const,
          label: settingsPageCopy.marketingEmails,
        },
      ] as const,
    [],
  );

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="notifications-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="notifications-heading" className="text-base">
          {settingsPageCopy.notificationsTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.notificationsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3"
          >
            <Label htmlFor={`notify-${item.key}`} className="text-sm text-foreground">
              {item.label}
            </Label>
            <Switch
              id={`notify-${item.key}`}
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
