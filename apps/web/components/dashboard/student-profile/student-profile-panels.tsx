import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import type { AuthSessionUser } from '../../../lib/auth';
import { formatDashboardDate } from '../../../lib/dashboard/format-date';
import type { StudentProfileDto } from '../../../lib/student';
import type { StudentClientPreferences } from '../student-settings/preferences-storage';
import { studentProfileCopy } from './copy';
import {
  formatAccountStatus,
  formatEmailVerified,
  formatOptionalField,
  formatPreferenceValue,
  formatProgressPercent,
} from './profile-display';

export function PersonalIdentityCard({
  profile,
  authUser,
}: {
  profile: StudentProfileDto;
  authUser: AuthSessionUser | null;
}): React.JSX.Element {
  const fields = [
    { label: studentProfileCopy.firstNameLabel, value: formatOptionalField(profile.firstName) },
    { label: studentProfileCopy.lastNameLabel, value: formatOptionalField(profile.lastName) },
    { label: studentProfileCopy.emailLabel, value: formatOptionalField(profile.email) },
    {
      label: studentProfileCopy.phoneLabel,
      value: formatOptionalField(authUser?.phone),
    },
    {
      label: studentProfileCopy.statusLabel,
      value: formatAccountStatus(authUser),
    },
    {
      label: studentProfileCopy.emailVerifiedLabel,
      value: formatEmailVerified(authUser),
    },
    {
      label: studentProfileCopy.rolesLabel,
      value: profile.roles.length > 0 ? profile.roles.join(', ') : studentProfileCopy.missingValue,
    },
  ] as const;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-personal-identity-heading">
      <CardHeader>
        <CardTitle id="student-personal-identity-heading" className="text-base">
          {studentProfileCopy.personalTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 tablet:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-caption text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrganizationMembershipCard({
  organizationIds,
}: {
  organizationIds: string[];
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-org-membership-heading">
      <CardHeader className="space-y-1">
        <CardTitle id="student-org-membership-heading" className="text-base">
          {studentProfileCopy.organizationTitle}
        </CardTitle>
        <CardDescription>{studentProfileCopy.organizationDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {organizationIds.length === 0 ? (
          <p className="text-small text-muted-foreground">{studentProfileCopy.organizationEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {organizationIds.map((organizationId) => (
              <li
                key={organizationId}
                className="rounded-lg border border-border bg-surface px-3 py-3"
              >
                <p className="text-caption text-muted-foreground">
                  {studentProfileCopy.organizationIdLabel}
                </p>
                <p className="text-sm font-medium text-foreground">{organizationId}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function LearningStatsCard({ profile }: { profile: StudentProfileDto }): React.JSX.Element {
  const learning = profile.learning;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-learning-stats-heading">
      <CardHeader className="space-y-1">
        <CardTitle id="student-learning-stats-heading" className="text-base">
          {studentProfileCopy.learningTitle}
        </CardTitle>
        <CardDescription>{studentProfileCopy.learningDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {learning === null ? (
          <p className="text-small text-muted-foreground">{studentProfileCopy.learningEmpty}</p>
        ) : (
          <dl className="grid gap-4 tablet:grid-cols-2">
            <div>
              <dt className="text-caption text-muted-foreground">
                {studentProfileCopy.completedLessons}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {learning.completedLessons}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">
                {studentProfileCopy.totalLessons}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{learning.totalLessons}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">
                {studentProfileCopy.progressPercent}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {formatProgressPercent(learning.percentage)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">
                {studentProfileCopy.remainingLessons}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {learning.remainingLessons}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">
                {studentProfileCopy.certificatesUnlocked}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {learning.certificatesUnlocked}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfileCertificatesCard({
  profile,
}: {
  profile: StudentProfileDto;
}): React.JSX.Element {
  const issued = profile.certificates.filter((certificate) => certificate.status === 'issued');

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-profile-certs-heading">
      <CardHeader className="space-y-1">
        <CardTitle id="student-profile-certs-heading" className="text-base">
          {studentProfileCopy.certificatesTitle}
        </CardTitle>
        <CardDescription>{studentProfileCopy.certificatesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {issued.length === 0 ? (
          <p className="text-small text-muted-foreground">{studentProfileCopy.certificatesEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {issued.map((certificate) => (
              <li
                key={certificate.id}
                className="rounded-lg border border-border bg-surface px-3 py-3"
              >
                <p className="text-sm font-medium text-foreground">{certificate.course.title}</p>
                <p className="text-caption text-muted-foreground">
                  {certificate.certificateNumber ?? certificate.status}
                  {certificate.issuedAt
                    ? ` · ${formatDashboardDate(certificate.issuedAt, studentProfileCopy.missingValue)}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PreferencesSummaryCard({
  preferences,
}: {
  preferences: StudentClientPreferences;
}): React.JSX.Element {
  const fields = [
    { label: studentProfileCopy.themeLabel, value: preferences.theme },
    {
      label: studentProfileCopy.languageLabel,
      value: formatPreferenceValue(preferences.language),
    },
    {
      label: studentProfileCopy.timezoneLabel,
      value: formatPreferenceValue(preferences.timezone),
    },
  ] as const;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="student-prefs-summary-heading">
      <CardHeader className="space-y-1">
        <CardTitle id="student-prefs-summary-heading" className="text-base">
          {studentProfileCopy.preferencesTitle}
        </CardTitle>
        <CardDescription>{studentProfileCopy.preferencesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 tablet:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-caption text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
