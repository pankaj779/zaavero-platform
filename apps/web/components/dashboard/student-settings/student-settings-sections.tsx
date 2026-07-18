'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@graphology/ui';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { studentSettingsCopy } from './copy';
import {
  STUDENT_UNSUPPORTED_ACCOUNT_ACTIONS,
  STUDENT_UNSUPPORTED_INTEGRATION_ACTIONS,
  STUDENT_UNSUPPORTED_SECURITY_ACTIONS,
  type StudentClientPreferences,
  type StudentThemePreference,
} from './preferences-storage';

function ClientOnlyBadge(): React.JSX.Element {
  return <Badge variant="neutral">{studentSettingsCopy.clientOnlyBadge}</Badge>;
}

export function StudentAppearanceSection({
  theme,
  onThemeChange,
}: {
  theme: StudentThemePreference;
  onThemeChange: (theme: StudentThemePreference) => void;
}): React.JSX.Element {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options: { value: StudentThemePreference; label: string }[] = [
    { value: 'system', label: studentSettingsCopy.themeSystem },
    { value: 'light', label: studentSettingsCopy.themeLight },
    { value: 'dark', label: studentSettingsCopy.themeDark },
  ];

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-appearance-heading">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="student-appearance-heading" className="text-base">
            {studentSettingsCopy.appearanceTitle}
          </CardTitle>
          <ClientOnlyBadge />
        </div>
        <CardDescription>{studentSettingsCopy.appearanceDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">
            {studentSettingsCopy.themeLabel}
          </legend>
          <RadioGroup
            value={mounted ? theme : theme}
            onValueChange={(value) => {
              const next = value as StudentThemePreference;
              onThemeChange(next);
              setTheme(next);
            }}
            className="grid gap-3 tablet:grid-cols-3"
            aria-label={studentSettingsCopy.themeLabel}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3"
              >
                <RadioGroupItem value={option.value} id={`student-theme-${option.value}`} />
                <Label htmlFor={`student-theme-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
        <p className="mt-3 text-caption text-muted-foreground">
          {studentSettingsCopy.clientOnlyNote}
        </p>
      </CardContent>
    </Card>
  );
}

export function StudentLanguageSection({
  language,
  onLanguageChange,
}: {
  language: string | null;
  onLanguageChange: (language: string | null) => void;
}): React.JSX.Element {
  const selectValue = language ?? 'unset';

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-language-heading">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="student-language-heading" className="text-base">
            {studentSettingsCopy.languageTitle}
          </CardTitle>
          <ClientOnlyBadge />
        </div>
        <CardDescription>{studentSettingsCopy.languageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectValue}
          onValueChange={(value) => {
            onLanguageChange(value === 'unset' ? null : value);
          }}
        >
          <SelectTrigger
            id="student-settings-language"
            aria-label={studentSettingsCopy.languageTitle}
          >
            <SelectValue placeholder={studentSettingsCopy.languageUnset} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">{studentSettingsCopy.languageUnset}</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-3 text-caption text-muted-foreground">
          {studentSettingsCopy.clientOnlyNote}
        </p>
      </CardContent>
    </Card>
  );
}

export function StudentTimezoneSection({
  timezone,
  onTimezoneChange,
}: {
  timezone: string | null;
  onTimezoneChange: (timezone: string | null) => void;
}): React.JSX.Element {
  const selectValue = timezone ?? 'unset';

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-timezone-heading">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="student-timezone-heading" className="text-base">
            {studentSettingsCopy.timezoneTitle}
          </CardTitle>
          <ClientOnlyBadge />
        </div>
        <CardDescription>{studentSettingsCopy.timezoneDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectValue}
          onValueChange={(value) => {
            onTimezoneChange(value === 'unset' ? null : value);
          }}
        >
          <SelectTrigger
            id="student-settings-timezone"
            aria-label={studentSettingsCopy.timezoneTitle}
          >
            <SelectValue placeholder={studentSettingsCopy.timezoneUnset} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">{studentSettingsCopy.timezoneUnset}</SelectItem>
            <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-3 text-caption text-muted-foreground">
          {studentSettingsCopy.clientOnlyNote}
        </p>
      </CardContent>
    </Card>
  );
}

export function StudentNotificationsSection({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-notifications-heading">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="student-notifications-heading" className="text-base">
            {studentSettingsCopy.notificationsTitle}
          </CardTitle>
          <ClientOnlyBadge />
        </div>
        <CardDescription>{studentSettingsCopy.notificationsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3">
          <Label htmlFor="student-in-app-notifications" className="text-sm text-foreground">
            {studentSettingsCopy.inAppNotifications}
          </Label>
          <Switch
            id="student-in-app-notifications"
            checked={enabled}
            onCheckedChange={onChange}
            aria-label={studentSettingsCopy.inAppNotifications}
          />
        </div>
        <p className="mt-3 text-caption text-muted-foreground">
          {studentSettingsCopy.clientOnlyNote}
        </p>
      </CardContent>
    </Card>
  );
}

export function StudentPrivacySection({
  privacy,
  onChange,
}: {
  privacy: StudentClientPreferences['privacy'];
  onChange: (privacy: StudentClientPreferences['privacy']) => void;
}): React.JSX.Element {
  const items = [
    {
      key: 'showFullNameInDiscussions' as const,
      label: studentSettingsCopy.showFullName,
    },
    {
      key: 'allowMentorDirectMessages' as const,
      label: studentSettingsCopy.allowMentorDm,
    },
    {
      key: 'shareProgressWithOrganization' as const,
      label: studentSettingsCopy.shareProgress,
    },
  ] as const;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-privacy-heading">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="student-privacy-heading" className="text-base">
            {studentSettingsCopy.privacyTitle}
          </CardTitle>
          <ClientOnlyBadge />
        </div>
        <CardDescription>{studentSettingsCopy.privacyDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3"
          >
            <Label htmlFor={`student-privacy-${item.key}`} className="text-sm text-foreground">
              {item.label}
            </Label>
            <Switch
              id={`student-privacy-${item.key}`}
              checked={privacy[item.key]}
              onCheckedChange={(checked) => {
                onChange({ ...privacy, [item.key]: checked });
              }}
              aria-label={item.label}
            />
          </div>
        ))}
        <p className="text-caption text-muted-foreground">{studentSettingsCopy.clientOnlyNote}</p>
      </CardContent>
    </Card>
  );
}

function DisabledActionsCard({
  titleId,
  title,
  description,
  actions,
}: {
  titleId: string;
  title: string;
  description: string;
  actions: readonly string[];
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby={titleId}>
      <CardHeader className="space-y-2">
        <CardTitle id={titleId} className="text-base">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((label) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between"
          >
            <p className="text-sm font-medium text-foreground">{label}</p>
            <div className="flex flex-col items-start gap-1 tablet:items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                aria-label={`${label} — ${studentSettingsCopy.unavailableNote}`}
              >
                {label}
              </Button>
              <p className="text-caption text-muted-foreground">
                {studentSettingsCopy.unavailableNote}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function StudentSecuritySection(): React.JSX.Element {
  return (
    <DisabledActionsCard
      titleId="student-security-heading"
      title={studentSettingsCopy.securityTitle}
      description={studentSettingsCopy.securityDescription}
      actions={STUDENT_UNSUPPORTED_SECURITY_ACTIONS}
    />
  );
}

export function StudentIntegrationsSection(): React.JSX.Element {
  return (
    <DisabledActionsCard
      titleId="student-integrations-heading"
      title={studentSettingsCopy.integrationsTitle}
      description={studentSettingsCopy.integrationsDescription}
      actions={STUDENT_UNSUPPORTED_INTEGRATION_ACTIONS}
    />
  );
}

export function StudentAccountActionsSection(): React.JSX.Element {
  return (
    <DisabledActionsCard
      titleId="student-account-actions-heading"
      title={studentSettingsCopy.accountTitle}
      description={studentSettingsCopy.accountDescription}
      actions={STUDENT_UNSUPPORTED_ACCOUNT_ACTIONS}
    />
  );
}
