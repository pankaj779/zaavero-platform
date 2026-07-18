'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from '@graphology/ui';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import type { AdminOrganizationDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { ADMIN_ROUTES } from '../../../lib/constants';
import { TeacherModuleErrorState } from '../../teacher/shared';
import { AdminCapabilityNotice, AdminPageHeader } from '../shared';

type SettingsTab =
  'general' | 'email' | 'security' | 'appearance' | 'academic' | 'organization' | 'integrations';

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'email', label: 'Email' },
  { id: 'security', label: 'Security' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'academic', label: 'Academic' },
  { id: 'organization', label: 'Organization' },
  { id: 'integrations', label: 'Integrations' },
];

export function AdminSettingsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [organization, setOrganization] = useState<AdminOrganizationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('');
  const [currency, setCurrency] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setError(true);
      setLoading(false);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(false);
    try {
      const result = await AdminApi.getOrganization(primaryOrganizationId);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setOrganization(result);
      setName(result.name);
      setTimezone(result.timezone);
      setLanguage(result.language);
      setCurrency(result.currency);
      setEmail(result.email ?? '');
      setLogo(result.logo ?? '');
      setIsActive(result.isActive);
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setOrganization(null);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [primaryOrganizationId]);

  useEffect(() => {
    void load();
  }, [load, version]);

  async function saveOrganization(): Promise<void> {
    if (!organization) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await AdminApi.updateOrganization(organization.id, {
        name: name.trim(),
        timezone: timezone.trim(),
        language: language.trim(),
        currency: currency.trim(),
        email: email.trim() || null,
        logo: logo.trim() || null,
        isActive,
      });
      setOrganization(updated);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && organization === null && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Settings"
          description="Review system, security, academic, and integration configuration."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading settings…
        </p>
      </div>
    );
  }

  if (error || organization === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Settings"
          description="Review system, security, academic, and integration configuration."
        />
        <TeacherModuleErrorState
          title="Unable to load settings"
          description="Retry to reload organization configuration."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Settings"
        description="Review system, security, academic, and integration configuration."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
        {tabs.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? 'default' : 'outline'}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => {
              setTab(item.id);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {formError ? (
        <p className="text-small text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      {tab === 'general' || tab === 'organization' ? (
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {tab === 'general' ? 'General settings' : 'Organization settings'}
            </CardTitle>
            <Button size="sm" disabled={saving} onClick={() => void saveOrganization()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 tablet:grid-cols-2">
            <Field label="Organization name" value={name} onChange={setName} />
            <Field label="Timezone" value={timezone} onChange={setTimezone} />
            <Field label="Language" value={language} onChange={setLanguage} />
            <Field label="Currency" value={currency} onChange={setCurrency} />
            <Field label="Contact email" value={email} onChange={setEmail} type="email" />
            <Field label="Logo URL" value={logo} onChange={setLogo} />
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 tablet:col-span-2">
              <div>
                <p className="text-sm font-medium">Organization active</p>
                <p className="text-caption text-muted-foreground">
                  Controls organization availability for new academic activity.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                }}
                aria-label="Organization active"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'appearance' ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Logo URL" value={logo} onChange={setLogo} />
            <Button size="sm" disabled={saving} onClick={() => void saveOrganization()}>
              Save branding
            </Button>
            <AdminCapabilityNotice
              title="Theme tokens"
              description="Light/dark theme preferences are client-local today. Organization-wide theme configuration is not exposed by the API yet."
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === 'academic' ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Academic defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow
              label="Courses & batches"
              value="Managed in Academic Hub"
              status="Available"
            />
            <SettingRow
              label="Attendance & live classes"
              value="Managed through existing LMS APIs"
              status="Available"
            />
            <SettingRow
              label="Course modules API"
              value="Schema only — no Nest endpoints yet"
              status="Unavailable"
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === 'email' ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Email operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-small text-muted-foreground">
              Review provider health, delivery statistics, queue failures, template previews, and
              invitations in the email workspace.
            </p>
            <Button asChild size="sm">
              <Link href={ADMIN_ROUTES.email}>Open email workspace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'security' ? (
        <UnavailableSettings
          title="Security settings"
          description="Password policies, MFA, and session controls are enforced by Auth defaults. Dedicated security policy endpoints are not available yet. Role assignment remains in Roles & Users."
        />
      ) : null}

      {tab === 'integrations' ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow
              label="Payments"
              value="Payments API workspace available"
              status="Available"
            />
            <SettingRow
              label="Email provider"
              value="Email operations workspace available"
              status="Available"
            />
            <SettingRow
              label="Live meeting providers"
              value="Configured per live session record"
              status="Partial"
            />
            <SettingRow
              label="Audit logging"
              value="Admin mutations write AuditLog entries"
              status="Available"
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}

function SettingRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'Available' | 'Partial' | 'Unavailable';
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-caption text-muted-foreground">{value}</p>
      </div>
      <Badge variant={status === 'Available' ? 'secondary' : 'neutral'}>{status}</Badge>
    </div>
  );
}

function UnavailableSettings({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminCapabilityNotice title="Backend capability missing" description={description} />
      </CardContent>
    </Card>
  );
}
