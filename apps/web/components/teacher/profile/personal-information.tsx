'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from '@graphology/ui';
import {
  formatTeacherProfileDate,
  getTeacherLanguageLabel,
  teacherProfilePageCopy,
  type TeacherProfileDto,
} from '../../../lib/teacher';

/** Editable-looking placeholder form — fields are disabled until backend integration. */
export function PersonalInformation({
  profile,
}: {
  profile: TeacherProfileDto;
}): React.JSX.Element {
  const copy = teacherProfilePageCopy;

  const fields = useMemo(
    () =>
      [
        { id: 'firstName', label: copy.firstNameLabel, value: profile.firstName },
        { id: 'lastName', label: copy.lastNameLabel, value: profile.lastName },
        { id: 'email', label: copy.emailLabel, value: profile.email },
        {
          id: 'phone',
          label: copy.phoneLabel,
          value: profile.phone ?? copy.phonePlaceholder,
        },
        {
          id: 'language',
          label: copy.languageLabel,
          value: getTeacherLanguageLabel(profile.language),
        },
        { id: 'timezone', label: copy.timezoneLabel, value: profile.timezone },
        {
          id: 'joined',
          label: copy.joinedLabel,
          value: formatTeacherProfileDate(profile.joinedAt),
        },
      ] as const,
    [copy, profile],
  );

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-personal-info-heading">
      <CardHeader>
        <CardTitle id="teacher-personal-info-heading" className="text-base">
          {copy.personalTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 tablet:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`teacher-profile-${field.id}`}>{field.label}</Label>
              <Input
                id={`teacher-profile-${field.id}`}
                value={field.value}
                disabled
                readOnly
                aria-label={`${field.label} — ${copy.comingSoonNote}`}
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="teacher-profile-bio">{copy.bioLabel}</Label>
          <Textarea
            id="teacher-profile-bio"
            value={profile.bio}
            disabled
            readOnly
            rows={4}
            aria-label={`${copy.bioLabel} — ${copy.comingSoonNote}`}
          />
        </div>
        <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
      </CardContent>
    </Card>
  );
}
