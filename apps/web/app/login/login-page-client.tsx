'use client';

import { Button, Input, Label } from '@graphology/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type SyntheticEvent } from 'react';
import { useAuth, resolvePostLoginPath, AuthError } from '../../lib/auth';
import { brandConfig } from '../../lib/brand';
import { ROUTES } from '../../lib/constants';

function resolveNextPath(next: string | null, roles: readonly string[]): string {
  return next?.startsWith('/') ? next : resolvePostLoginPath(roles);
}

function LoginForm(): React.JSX.Element {
  const { login, isAuthenticated, loading, roles } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(resolveNextPath(searchParams.get('next'), roles));
    }
  }, [loading, isAuthenticated, roles, router, searchParams]);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login({ email: email.trim(), password });
      router.replace(resolveNextPath(searchParams.get('next'), user.roles));
    } catch (err: unknown) {
      const message =
        err instanceof AuthError ? err.message : 'Unable to sign in. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || isAuthenticated) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground"
        role="status"
      >
        Preparing your session…
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use your Graphology Academy account credentials.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Have an invite?{' '}
        <Link href={ROUTES.acceptInvitation} className="underline-offset-4 hover:underline">
          Accept invitation
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        <Link href={ROUTES.home} className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </form>
  );
}

export function LoginPageClient(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground" role="status">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
