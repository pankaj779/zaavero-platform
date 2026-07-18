import { describe, expect, it } from 'vitest';
import { resolveEmailProvider } from './email-provider.factory';
import type { EmailProvider } from './email-provider.interface';

const resendProvider = { name: 'RESEND' } as unknown as EmailProvider;
const sandboxProvider = { name: 'SANDBOX' } as unknown as EmailProvider;

describe('resolveEmailProvider', () => {
  it('selects the sandbox provider outside production when sandbox mode is on', () => {
    expect(
      resolveEmailProvider(
        { NODE_ENV: 'development', EMAIL_PROVIDER: 'RESEND', EMAIL_SANDBOX_MODE: true },
        resendProvider,
        sandboxProvider,
      ),
    ).toBe(sandboxProvider);
    expect(
      resolveEmailProvider(
        { NODE_ENV: 'test', EMAIL_PROVIDER: 'SANDBOX', EMAIL_SANDBOX_MODE: false },
        resendProvider,
        sandboxProvider,
      ),
    ).toBe(sandboxProvider);
  });

  it('selects the Resend provider when sandbox mode is off', () => {
    expect(
      resolveEmailProvider(
        { NODE_ENV: 'development', EMAIL_PROVIDER: 'RESEND', EMAIL_SANDBOX_MODE: false },
        resendProvider,
        sandboxProvider,
      ),
    ).toBe(resendProvider);
  });

  it('never selects the sandbox provider in production', () => {
    expect(
      resolveEmailProvider(
        { NODE_ENV: 'production', EMAIL_PROVIDER: 'RESEND', EMAIL_SANDBOX_MODE: false },
        resendProvider,
        sandboxProvider,
      ),
    ).toBe(resendProvider);
    // Defense in depth: even if validation were bypassed, production stays real.
    expect(
      resolveEmailProvider(
        { NODE_ENV: 'production', EMAIL_PROVIDER: 'SANDBOX', EMAIL_SANDBOX_MODE: true },
        resendProvider,
        sandboxProvider,
      ),
    ).toBe(resendProvider);
  });
});
