'use client';

import {
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
import type { AdminOrganizationDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleErrorState } from '../../teacher/shared';
import { AdminCapabilityNotice, AdminPageHeader } from '../shared';

export function AdminOrganizationView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [organization, setOrganization] = useState<AdminOrganizationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [language, setLanguage] = useState('');
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
      setSlug(result.slug);
      setLogo(result.logo ?? '');
      setWebsite(result.website ?? '');
      setEmail(result.email ?? '');
      setPhone(result.phone ?? '');
      setAddress(result.address ?? '');
      setTimezone(result.timezone);
      setCurrency(result.currency);
      setLanguage(result.language);
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

  async function save(): Promise<void> {
    if (!organization) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await AdminApi.updateOrganization(organization.id, {
        name: name.trim(),
        slug: slug.trim(),
        logo: logo.trim() || null,
        website: website.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        timezone: timezone.trim(),
        currency: currency.trim(),
        language: language.trim(),
        isActive,
      });
      setOrganization(updated);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to save organization settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && organization === null && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Organization"
          description="Organization identity, locale, branding, and membership settings."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading organization…
        </p>
      </div>
    );
  }

  if (error || organization === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Organization"
          description="Organization identity, locale, branding, and membership settings."
        />
        <TeacherModuleErrorState
          title="Unable to load organization"
          description="Retry to reload organization profile and settings."
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
        title="Organization"
        description="Organization identity, locale, branding, and membership settings."
        actions={
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <section className="grid gap-4 tablet:grid-cols-3" aria-label="Organization counts">
        <Stat label="Members" value={organization.counts.members} />
        <Stat label="Courses" value={organization.counts.courses} />
        <Stat label="Batches" value={organization.counts.batches} />
      </section>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Organization profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 tablet:grid-cols-2">
          {formError ? (
            <p className="tablet:col-span-2 text-small text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Slug" value={slug} onChange={setSlug} />
          <Field label="Logo URL" value={logo} onChange={setLogo} />
          <Field label="Website" value={website} onChange={setWebsite} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field
            label="Address"
            value={address}
            onChange={setAddress}
            className="tablet:col-span-2"
          />
          <Field label="Timezone" value={timezone} onChange={setTimezone} />
          <Field label="Language" value={language} onChange={setLanguage} />
          <Field label="Currency" value={currency} onChange={setCurrency} />
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Active organization</p>
              <p className="text-caption text-muted-foreground">
                Inactive organizations remain visible for audit history.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => {
                setIsActive(checked);
              }}
              aria-label="Active organization"
            />
          </div>
        </CardContent>
      </Card>

      <AdminCapabilityNotice
        title="Branding asset upload"
        description="Logo currently accepts a URL because the platform does not yet expose organization media upload endpoints."
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <p className="text-caption text-muted-foreground">{label}</p>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
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
