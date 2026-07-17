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
import { settingsPageCopy, type PrivacyPreferencesDto } from '../../../lib/dashboard';

export function PrivacySection({
  initialPreferences,
}: {
  initialPreferences: PrivacyPreferencesDto;
}): React.JSX.Element {
  const [prefs, setPrefs] = useState(initialPreferences);

  const items = useMemo(
    () =>
      [
        {
          key: 'showFullNameInDiscussions' as const,
          label: settingsPageCopy.showFullName,
        },
        {
          key: 'allowMentorDirectMessages' as const,
          label: settingsPageCopy.allowMentorDm,
        },
        {
          key: 'shareProgressWithOrganization' as const,
          label: settingsPageCopy.shareProgress,
        },
      ] as const,
    [],
  );

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="privacy-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="privacy-heading" className="text-base">
          {settingsPageCopy.privacyTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.privacyDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3"
          >
            <Label htmlFor={`privacy-${item.key}`} className="text-sm text-foreground">
              {item.label}
            </Label>
            <Switch
              id={`privacy-${item.key}`}
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
