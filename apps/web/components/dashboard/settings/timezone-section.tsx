'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { useState } from 'react';
import { settingsPageCopy } from '../../../lib/dashboard';

export function TimezoneSection({ initialTimezone }: { initialTimezone: string }): React.JSX.Element {
  const [timezone, setTimezone] = useState(initialTimezone);

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="timezone-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="timezone-heading" className="text-base">
          {settingsPageCopy.timezoneTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.timezoneDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="sr-only" htmlFor="settings-timezone">
          {settingsPageCopy.timezoneTitle}
        </label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="settings-timezone" aria-label={settingsPageCopy.timezoneTitle}>
            <SelectValue placeholder={timezone} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
