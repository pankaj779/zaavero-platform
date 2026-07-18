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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@graphology/ui';
import { useCallback, useEffect, useState } from 'react';
import { EmailApi, type EmailDigestMode, type EmailPreferencesDto } from '../../lib/api';

const preferenceItems: {
  key: keyof Omit<EmailPreferencesDto, 'security' | 'digestMode'>;
  label: string;
}[] = [
  { key: 'announcements', label: 'Announcements' },
  { key: 'assignments', label: 'Assignments and submissions' },
  { key: 'courses', label: 'Course updates' },
  { key: 'payments', label: 'Payments and receipts' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'liveClasses', label: 'Live class reminders' },
  { key: 'system', label: 'System updates' },
  { key: 'marketing', label: 'Marketing emails' },
];

export function EmailPreferencesCard({
  organizationId,
  title = 'Email preferences',
}: {
  organizationId: string;
  title?: string;
}): React.JSX.Element {
  const [preferences, setPreferences] = useState<EmailPreferencesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPreferences(await EmailApi.getPreferences(organizationId));
    } catch {
      setError('Unable to load email preferences.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(changes: Partial<EmailPreferencesDto>, key: string): Promise<void> {
    if (!preferences) return;
    const previous = preferences;
    setSavingKey(key);
    setSaved(false);
    setError(null);
    setPreferences({ ...preferences, ...changes });
    try {
      const next = await EmailApi.updatePreferences({ organizationId, ...changes });
      setPreferences(next);
      setSaved(true);
    } catch {
      setPreferences(previous);
      setError('Unable to save email preferences. Your previous setting was restored.');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="email-preferences-heading">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="email-preferences-heading" className="text-base">
            {title}
          </CardTitle>
          <Badge variant="secondary">Synced</Badge>
        </div>
        <CardDescription>
          Choose which messages arrive by email. Security emails are always enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="py-6 text-center text-small text-muted-foreground" role="status">
            Loading email preferences…
          </p>
        ) : preferences ? (
          <>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3">
              <div>
                <Label htmlFor="email-security">Security emails</Label>
                <p className="text-caption text-muted-foreground">
                  Sign-in, verification, and account protection notices.
                </p>
              </div>
              <Switch
                id="email-security"
                checked
                disabled
                aria-label="Security emails always enabled"
              />
            </div>
            {preferenceItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-3"
              >
                <Label htmlFor={`email-${item.key}`} className="text-sm">
                  {item.label}
                </Label>
                <Switch
                  id={`email-${item.key}`}
                  checked={preferences[item.key]}
                  disabled={savingKey !== null}
                  onCheckedChange={(checked) => void update({ [item.key]: checked }, item.key)}
                  aria-label={item.label}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="email-digest-mode">Delivery frequency</Label>
              <Select
                value={preferences.digestMode}
                disabled={savingKey !== null}
                onValueChange={(value) =>
                  void update({ digestMode: value as EmailDigestMode }, 'digestMode')
                }
              >
                <SelectTrigger id="email-digest-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediately</SelectItem>
                  <SelectItem value="DAILY">Daily digest</SelectItem>
                  <SelectItem value="WEEKLY">Weekly digest</SelectItem>
                  <SelectItem value="OFF">No non-security delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}
        {error ? (
          <div className="flex items-center justify-between gap-3" role="alert">
            <p className="text-small text-destructive">{error}</p>
            {!preferences ? (
              <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}
        {saved ? (
          <p className="text-small text-success" role="status">
            Email preference saved.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EmailVerificationCard({
  email,
  verified,
}: {
  email: string;
  verified: boolean;
}): React.JSX.Element {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function resend(): Promise<void> {
    setSending(true);
    setError(false);
    setMessage(null);
    try {
      await EmailApi.resendVerification(email);
      setMessage('If verification is still required, a new link has been sent.');
    } catch {
      setError(true);
      setMessage('Unable to resend the verification email. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="email-verification-heading">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle id="email-verification-heading" className="text-base">
            Email verification
          </CardTitle>
          <Badge variant={verified ? 'secondary' : 'neutral'}>
            {verified ? 'Verified' : 'Not verified'}
          </Badge>
        </div>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      {!verified ? (
        <CardContent className="space-y-3">
          <p className="text-small text-muted-foreground">
            Verify your address to protect your account and receive important messages.
          </p>
          <Button type="button" size="sm" disabled={sending} onClick={() => void resend()}>
            {sending ? 'Sending…' : 'Resend verification'}
          </Button>
          {message ? (
            <p
              className={error ? 'text-small text-destructive' : 'text-small text-muted-foreground'}
              role="status"
            >
              {message}
            </p>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
