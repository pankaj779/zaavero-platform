'use client';

import { Button, Input, Label } from '@graphology/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type SyntheticEvent } from 'react';
import { EmailApi } from '../../lib/api';
import { AuthError } from '../../lib/auth';
import { brandConfig } from '../../lib/brand';
import { ROUTES } from '../../lib/constants';

function AcceptInvitationFormInner(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get('token')?.trim() ?? '';

  const [token, setToken] = useState(tokenFromQuery);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [needsAccount, setNeedsAccount] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await EmailApi.acceptInvitation({
        token: token.trim(),
        ...(needsAccount
          ? {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              password,
            }
          : {}),
      });
      setDone(true);
      window.setTimeout(() => {
        router.replace(ROUTES.login);
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof AuthError
          ? err.message
          : 'Unable to accept this invitation. Check the token and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Invitation accepted</h1>
        <p className="text-sm text-muted-foreground" role="status">
          Your account is ready. Redirecting to sign in…
        </p>
        <Link href={ROUTES.login} className="text-sm underline-offset-4 hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border border-border bg-card p-8 shadow-sm"
      noValidate
    >
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">{brandConfig.company.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accept invitation</h1>
        <p className="text-sm text-muted-foreground">
          Use the token from your invitation email. New accounts need a name and password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invitation-token">Invitation token</Label>
        <Input
          id="invitation-token"
          name="token"
          required
          minLength={32}
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
          }}
          autoComplete="off"
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={needsAccount}
          onChange={(event) => {
            setNeedsAccount(event.target.checked);
          }}
        />
        I need to create a new account for this email
      </label>

      {needsAccount ? (
        <>
          <div className="grid gap-4 tablet:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invitation-first-name">First name</Label>
              <Input
                id="invitation-first-name"
                required={needsAccount}
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                }}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitation-last-name">Last name</Label>
              <Input
                id="invitation-last-name"
                required={needsAccount}
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                }}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invitation-password">Password</Label>
            <Input
              id="invitation-password"
              type="password"
              required={needsAccount}
              minLength={8}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              autoComplete="new-password"
            />
          </div>
        </>
      ) : (
        <p className="text-caption text-muted-foreground">
          Existing accounts are linked without a password. Sign in afterward with your current
          credentials.
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || token.trim().length < 32} className="w-full">
        {submitting ? 'Accepting…' : 'Accept invitation'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href={ROUTES.login} className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function AcceptInvitationForm(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground" role="status">
            Loading invitation…
          </div>
        }
      >
        <AcceptInvitationFormInner />
      </Suspense>
    </main>
  );
}
