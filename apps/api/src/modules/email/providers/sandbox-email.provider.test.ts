import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { EnvConfig } from '../../../config/env.schema';
import {
  EmailBatchLimitExceededException,
  EmailBatchUnsupportedFieldException,
  EmailWebhookReplayedException,
  InvalidEmailRequestException,
  InvalidEmailWebhookException,
} from '../exceptions';
import { SandboxEmailProvider } from './sandbox-email.provider';

function createProvider(overrides: Partial<EnvConfig> = {}): SandboxEmailProvider {
  return new SandboxEmailProvider(
    new ConfigService<EnvConfig, true>({
      EMAIL_WEBHOOK_TOLERANCE_SECONDS: 300,
      ...overrides,
    }),
  );
}

describe('SandboxEmailProvider', () => {
  it('is always configured and clearly reports sandbox status', () => {
    const provider = createProvider();

    expect(provider.isConfigured()).toBe(true);
    expect(provider.getStatus()).toEqual({
      provider: 'SANDBOX',
      configured: true,
      sandbox: true,
      webhookVerificationConfigured: false,
    });
  });

  it('captures emails with deterministic-ish sandbox ids and SANDBOX status', async () => {
    const first = await createProvider().sendEmail({
      to: 'student@example.com',
      subject: 'Welcome',
      html: '<p>Hi</p>',
    });
    const second = await createProvider().sendEmail({
      to: 'student@example.com',
      subject: 'Welcome',
      html: '<p>Hi</p>',
    });
    const different = await createProvider().sendEmail({
      to: 'student@example.com',
      subject: 'Other subject',
      text: 'Hi',
    });

    expect(first.provider).toBe('SANDBOX');
    expect(first.status).toBe('SANDBOX');
    expect(first.providerMessageId).toMatch(/^sandbox_[0-9a-f]{16}_\d+$/);
    // Same recipients + subject hash to the same id across instances.
    expect(second.providerMessageId).toBe(first.providerMessageId);
    expect(different.providerMessageId).not.toBe(first.providerMessageId);
  });

  it('issues unique ids for repeated sends within one instance', async () => {
    const provider = createProvider();
    const input = { to: 'a@example.com', subject: 'Same', text: 'Hi' };

    const first = await provider.sendEmail(input);
    const second = await provider.sendEmail(input);

    expect(first.providerMessageId).not.toBe(second.providerMessageId);
  });

  it('requires an email body', async () => {
    await expect(
      createProvider().sendEmail({ to: 'a@example.com', subject: 'Empty' }),
    ).rejects.toBeInstanceOf(InvalidEmailRequestException);
  });

  it('applies the same batch rules as real providers', async () => {
    const provider = createProvider();

    const results = await provider.sendBatch([
      { to: 'a@example.com', subject: 'One', text: '1' },
      { to: ['b@example.com', 'c@example.com'], subject: 'Two', text: '2' },
    ]);
    expect(results).toHaveLength(2);
    expect(results.every((result) => result.status === 'SANDBOX')).toBe(true);

    await expect(provider.sendBatch([])).rejects.toBeInstanceOf(InvalidEmailRequestException);

    const oversized = Array.from({ length: 101 }, (_, index) => ({
      to: `user${String(index)}@example.com`,
      subject: 'Bulk',
      text: 'Hi',
    }));
    await expect(provider.sendBatch(oversized)).rejects.toBeInstanceOf(
      EmailBatchLimitExceededException,
    );

    await expect(
      provider.sendBatch([
        { to: 'a@example.com', subject: 'Bulk', text: 'Hi', scheduledAt: new Date() } as never,
      ]),
    ).rejects.toBeInstanceOf(EmailBatchUnsupportedFieldException);
  });

  it('parses webhooks and still enforces the replay window', () => {
    const provider = createProvider();
    const now = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({
      type: 'email.delivered',
      created_at: '2026-07-18T19:00:00.000Z',
      data: { email_id: 'sandbox_abc_1' },
    });

    const event = provider.verifyWebhook({
      rawBody,
      svixId: 'hook_1',
      svixTimestamp: String(now),
      svixSignature: '',
    });
    expect(event).toMatchObject({
      id: 'hook_1',
      type: 'email.delivered',
      providerMessageId: 'sandbox_abc_1',
    });

    expect(() =>
      provider.verifyWebhook({
        rawBody,
        svixId: 'hook_1',
        svixTimestamp: String(now - 301),
        svixSignature: '',
      }),
    ).toThrow(EmailWebhookReplayedException);

    expect(() =>
      provider.verifyWebhook({
        rawBody: 'not-json',
        svixId: 'hook_1',
        svixTimestamp: String(now),
        svixSignature: '',
      }),
    ).toThrow(InvalidEmailWebhookException);
  });
});
