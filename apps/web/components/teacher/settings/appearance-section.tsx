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

import { useEffect, useMemo, useState } from 'react';

import {
  teacherSettingsPageCopy,
  teacherThemePreferenceLabel,
  type TeacherThemePreference,
} from '../../../lib/teacher';

export function AppearanceSection({
  defaultTheme,
}: {
  defaultTheme: TeacherThemePreference;
}): React.JSX.Element {
  const copy = teacherSettingsPageCopy;

  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeOptions = useMemo(
    () =>
      (['system', 'light', 'dark'] as const).map((value) => ({
        value,

        label: teacherThemePreferenceLabel[value],
      })),

    [],
  );

  const currentTheme =
    (mounted ? (theme as TeacherThemePreference | undefined) : defaultTheme) ?? defaultTheme;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-appearance-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="teacher-appearance-heading" className="text-base">
          {copy.appearanceTitle}
        </CardTitle>

        <CardDescription>{copy.appearanceDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">{copy.themeLabel}</legend>

          <RadioGroup
            value={currentTheme}

            onValueChange={(value) => {
              setTheme(value);
            }}

            className="grid gap-3 tablet:grid-cols-3"

            aria-label={copy.themeLabel}
          >
            {themeOptions.map((option) => (
              <div
                key={option.value}

                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 transition-colors duration-200 motion-reduce:transition-none"
              >
                <RadioGroupItem value={option.value} id={`teacher-theme-${option.value}`} />

                <Label htmlFor={`teacher-theme-${option.value}`} className="cursor-pointer">
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
