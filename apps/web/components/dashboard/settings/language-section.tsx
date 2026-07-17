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
import { getLanguageLabel, settingsPageCopy } from '../../../lib/dashboard';

export function LanguageSection({ initialLanguage }: { initialLanguage: string }): React.JSX.Element {
  const [language, setLanguage] = useState(initialLanguage);

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="language-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="language-heading" className="text-base">
          {settingsPageCopy.languageTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.languageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="sr-only" htmlFor="settings-language">
          {settingsPageCopy.languageTitle}
        </label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="settings-language" aria-label={settingsPageCopy.languageTitle}>
            <SelectValue placeholder={getLanguageLabel(language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{getLanguageLabel('en')}</SelectItem>
            <SelectItem value="hi">Language placeholder (hi)</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
