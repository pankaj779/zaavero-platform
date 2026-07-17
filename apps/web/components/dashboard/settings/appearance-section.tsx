'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@graphology/ui';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { settingsPageCopy, type ThemePreference } from '../../../lib/dashboard';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: settingsPageCopy.themeSystem },
  { value: 'light', label: settingsPageCopy.themeLight },
  { value: 'dark', label: settingsPageCopy.themeDark },
];

export function AppearanceSection({
  defaultTheme,
}: {
  defaultTheme: ThemePreference;
}): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (mounted ? (theme as ThemePreference | undefined) : defaultTheme) ?? defaultTheme;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="appearance-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="appearance-heading" className="text-base">
          {settingsPageCopy.appearanceTitle}
        </CardTitle>
        <CardDescription>{settingsPageCopy.appearanceDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">{settingsPageCopy.themeLabel}</legend>
          <RadioGroup
            value={currentTheme}
            onValueChange={(value) => {
              setTheme(value);
            }}
            className="grid gap-3 tablet:grid-cols-3"
            aria-label={settingsPageCopy.themeLabel}
          >
            {themeOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 transition-colors duration-200 motion-reduce:transition-none"
              >
                <RadioGroupItem value={option.value} id={`theme-${option.value}`} />
                <Label htmlFor={`theme-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      </CardContent>
    </Card>
  );
}
