'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { EmailApi, type InvitationDto, type InvitationType } from '../../lib/api';
import { AuthError } from '../../lib/auth';

const ROLE_BY_TYPE: Record<Exclude<InvitationType, 'ORGANIZATION'>, string> = {
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

export function InvitationManagementCard({
  organizationId,
  allowedTypes,
  title = 'Invitations',
  description = 'Invite people by email. Recent pending invitations can be resent or revoked.',
}: {
  organizationId: string;
  allowedTypes: readonly InvitationType[];
  title?: string;
  description?: string;
}): React.JSX.Element {
  const defaultType = allowedTypes[0] ?? 'STUDENT';
  const [email, setEmail] = useState('');
  const [type, setType] = useState<InvitationType>(defaultType);
  const [organizationRole, setOrganizationRole] = useState('Student');
  const [items, setItems] = useState<InvitationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    EmailApi.getInvitations(organizationId)
      .then((invitations) => {
        if (active) setItems(invitations);
      })
      .catch(() => {
        if (active) setError('Unable to load invitations.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  function upsert(invitation: InvitationDto): void {
    setItems((current) => {
      const next = current.filter((item) => item.id !== invitation.id);
      return [invitation, ...next];
    });
  }

  async function onCreate(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const role = type === 'ORGANIZATION' ? organizationRole.trim() : ROLE_BY_TYPE[type];
      const invitation = await EmailApi.createInvitation({
        organizationId,
        email,
        type,
        role,
      });
      upsert(invitation);
      setEmail('');
      setNotice(`Invitation queued for ${invitation.email}.`);
    } catch (err: unknown) {
      setError(err instanceof AuthError ? err.message : 'Unable to create invitation.');
    } finally {
      setSaving(false);
    }
  }

  async function onResend(id: string): Promise<void> {
    setActionId(id);
    setError(null);
    setNotice(null);
    try {
      const invitation = await EmailApi.resendInvitation(id, organizationId);
      upsert(invitation);
      setNotice(`Invitation resent to ${invitation.email}.`);
    } catch (err: unknown) {
      setError(err instanceof AuthError ? err.message : 'Unable to resend invitation.');
    } finally {
      setActionId(null);
    }
  }

  async function onRevoke(id: string): Promise<void> {
    setActionId(id);
    setError(null);
    setNotice(null);
    try {
      const invitation = await EmailApi.revokeInvitation(id, organizationId);
      upsert(invitation);
      setNotice(`Invitation revoked for ${invitation.email}.`);
    } catch (err: unknown) {
      setError(err instanceof AuthError ? err.message : 'Unable to revoke invitation.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="invitation-management-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="invitation-management-heading" className="text-base">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            void onCreate(event);
          }}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="invitation-email">Email</Label>
            <Input
              id="invitation-email"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-4 tablet:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invitation-type">Invitation type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as InvitationType);
                }}
              >
                <SelectTrigger id="invitation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === 'ORGANIZATION' ? (
              <div className="space-y-2">
                <Label htmlFor="invitation-role">Role name</Label>
                <Input
                  id="invitation-role"
                  value={organizationRole}
                  onChange={(event) => {
                    setOrganizationRole(event.target.value);
                  }}
                  placeholder="Student"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Assigned role</Label>
                <p className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                  {ROLE_BY_TYPE[type]}
                </p>
              </div>
            )}
          </div>
          <Button type="submit" size="sm" disabled={saving || !email.trim()}>
            {saving ? 'Sending…' : 'Send invitation'}
          </Button>
        </form>

        {loading ? (
          <p className="text-small text-muted-foreground" role="status">
            Loading invitations…
          </p>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Recent invitations</p>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.email}</p>
                    <Badge variant="neutral">{item.status}</Badge>
                    <Badge variant="secondary">{item.type}</Badge>
                  </div>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {item.role} · expires {formatDate(item.expiresAt)} · id {item.id}
                  </p>
                </div>
                {item.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actionId !== null}
                      onClick={() => {
                        void onResend(item.id);
                      }}
                    >
                      {actionId === item.id ? 'Working…' : 'Resend'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actionId !== null}
                      onClick={() => {
                        void onRevoke(item.id);
                      }}
                    >
                      {actionId === item.id ? 'Working…' : 'Revoke'}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-small text-muted-foreground">No invitations yet.</p>
        )}

        {notice ? (
          <p className="text-small text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="text-small text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
