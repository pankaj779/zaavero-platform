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
import { teacherSettingsPageCopy } from '../../../lib/teacher';

export function TimezoneSection({
  initialTimezone,
}: {
  initialTimezone: string;
}): React.JSX.Element {
  const copy = teacherSettingsPageCopy;
  const [timezone, setTimezone] = useState(initialTimezone);

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-timezone-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="teacher-timezone-heading" className="text-base">
          {copy.timezoneTitle}
        </CardTitle>
        <CardDescription>{copy.timezoneDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="sr-only" htmlFor="teacher-settings-timezone">
          {copy.timezoneTitle}
        </label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="teacher-settings-timezone" aria-label={copy.timezoneTitle}>
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
