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
import { getTeacherLanguageLabel, teacherSettingsPageCopy } from '../../../lib/teacher';

export function LanguageSection({
  initialLanguage,
}: {
  initialLanguage: string;
}): React.JSX.Element {
  const copy = teacherSettingsPageCopy;
  const [language, setLanguage] = useState(initialLanguage);

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-language-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="teacher-language-heading" className="text-base">
          {copy.languageTitle}
        </CardTitle>
        <CardDescription>{copy.languageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="sr-only" htmlFor="teacher-settings-language">
          {copy.languageTitle}
        </label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="teacher-settings-language" aria-label={copy.languageTitle}>
            <SelectValue placeholder={getTeacherLanguageLabel(language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{getTeacherLanguageLabel('en')}</SelectItem>
            <SelectItem value="hi">Language placeholder (hi)</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
