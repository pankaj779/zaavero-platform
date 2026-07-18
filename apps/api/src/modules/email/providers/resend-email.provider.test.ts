import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnvConfig } from '../../../config/env.schema';
import {
  EmailBatchLimitExceededException,
  EmailBatchUnsupportedFieldException,
  EmailProviderNotConfiguredException,
  EmailProviderRejectedException,
  EmailProviderUnavailableException,
  EmailWebhookReplayedException,
  InvalidEmailRequestException,
  InvalidEmailWebhookException,
} from '../exceptions';
import { ResendEmailProvider } from './resend-email.provider';

const { sendMock, batchSendMock, verifyMock, resendConstructorMock } = vi.hoisted(() => {
  const sendMock = vi.fn();
  const batchSendMock = vi.fn();
  const verifyMock = vi.fn();
  const resendConstructorMock = vi.fn();
  return { sendMock, batchSendMock, verifyMock, resendConstructorMock };
});

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
    batch = { send: batchSendMock };
    webhooks = { verify: verifyMock };

    constructor(apiKey?: string) {
      resendConstructorMock(apiKey);
    }
  },
}));

function createProvider(overrides: Partial<EnvConfig> = {}): ResendEmailProvider {
  return new ResendEmailProvider(
    new ConfigService<EnvConfig, true>({
      RESEND_API_KEY: 're_test_key',
      RESEND_WEBHOOK_SECRET: 'whsec_test',
      EMAIL_FROM: 'no-reply@graphology.local',
      EMAIL_WEBHOOK_TOLERANCE_SECONDS: 300,
      ...overrides,
    }),
  );
}

function freshTimestamp(offsetSeconds = 0): string {
  return String(Math.floor(Date.now() / 1000) + offsetSeconds);
}

beforeEach(() => {
  sendMock.mockReset();
  batchSendMock.mockReset();
  verifyMock.mockReset();
  resendConstructorMock.mockReset();
});

describe('ResendEmailProvider', () => {
  it('reports configuration status without exposing secrets', () => {
    const configured = createProvider();
    const unconfigured = createProvider({
      RESEND_API_KEY: undefined,
      RESEND_WEBHOOK_SECRET: undefined,
    });

    expect(configured.isConfigured()).toBe(true);
    expect(configured.getStatus()).toEqual({
      provider: 'RESEND',
      configured: true,
      sandbox: false,
      webhookVerificationConfigured: true,
    });
    expect(unconfigured.isConfigured()).toBe(false);
    expect(unconfigured.getStatus()).toEqual({
      provider: 'RESEND',
      configured: false,
      sandbox: false,
      webhookVerificationConfigured: false,
    });
  });

  describe('sendEmail', () => {
    it('sends via the SDK with defaults and the idempotency key', async () => {
      sendMock.mockResolvedValue({ data: { id: 'msg_1' }, error: null });
      const provider = createProvider({ EMAIL_REPLY_TO: 'support@graphology.local' });

      const result = await provider.sendEmail({
        to: 'student@example.com',
        subject: 'Welcome',
        html: '<p>Hi</p>',
        text: 'Hi',
        cc: ['cc@example.com'],
        bcc: 'bcc@example.com',
        headers: { 'X-Entity-Ref-ID': 'abc' },
        tags: [{ name: 'category', value: 'welcome' }],
        idempotencyKey: 'email/welcome/1',
      });

      expect(resendConstructorMock).toHaveBeenCalledWith('re_test_key');
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'no-reply@graphology.local',
          to: 'student@example.com',
          subject: 'Welcome',
          html: '<p>Hi</p>',
          text: 'Hi',
          replyTo: 'support@graphology.local',
          cc: ['cc@example.com'],
          bcc: 'bcc@example.com',
          headers: { 'X-Entity-Ref-ID': 'abc' },
          tags: [{ name: 'category', value: 'welcome' }],
        }),
        { idempotencyKey: 'email/welcome/1' },
      );
      expect(result).toEqual({ providerMessageId: 'msg_1', provider: 'RESEND', status: 'SENT' });
    });

    it('honors explicit from/replyTo overrides and scheduling', async () => {
      sendMock.mockResolvedValue({ data: { id: 'msg_2' }, error: null });
      const provider = createProvider();
      const scheduledAt = new Date('2026-08-01T10:00:00.000Z');

      const result = await provider.sendEmail({
        to: ['a@example.com'],
        subject: 'Scheduled',
        text: 'Later',
        from: 'events@graphology.local',
        replyTo: ['replies@graphology.local'],
        scheduledAt,
      });

      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'events@graphology.local',
          replyTo: ['replies@graphology.local'],
          scheduledAt: '2026-08-01T10:00:00.000Z',
        }),
        undefined,
      );
      expect(result.status).toBe('SCHEDULED');
    });

    it('maps attachments and rejects unsafe ones', async () => {
      sendMock.mockResolvedValue({ data: { id: 'msg_3' }, error: null });
      const provider = createProvider();

      await provider.sendEmail({
        to: 'a@example.com',
        subject: 'Attached',
        html: '<p>doc</p>',
        attachments: [
          { filename: 'inline.txt', content: 'aGVsbG8=', contentType: 'text/plain' },
          { filename: 'hosted.pdf', path: 'https://cdn.example.com/hosted.pdf' },
        ],
      });
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            { filename: 'inline.txt', content: 'aGVsbG8=', contentType: 'text/plain' },
            { filename: 'hosted.pdf', path: 'https://cdn.example.com/hosted.pdf' },
          ],
        }),
        undefined,
      );

      await expect(
        provider.sendEmail({
          to: 'a@example.com',
          subject: 'Bad path',
          html: '<p>doc</p>',
          attachments: [{ filename: 'secrets.txt', path: 'file:///etc/passwd' }],
        }),
      ).rejects.toBeInstanceOf(InvalidEmailRequestException);

      await expect(
        provider.sendEmail({
          to: 'a@example.com',
          subject: 'Ambiguous',
          html: '<p>doc</p>',
          attachments: [{ filename: 'both.txt', content: 'x', path: 'https://cdn.example.com/x' }],
        }),
      ).rejects.toBeInstanceOf(InvalidEmailRequestException);
    });

    it('requires an html or text body', async () => {
      const provider = createProvider();

      await expect(
        provider.sendEmail({ to: 'a@example.com', subject: 'Empty' }),
      ).rejects.toBeInstanceOf(InvalidEmailRequestException);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('throws a typed error without network access when unconfigured', async () => {
      const provider = createProvider({ RESEND_API_KEY: undefined });

      await expect(
        provider.sendEmail({ to: 'a@example.com', subject: 'Hi', text: 'Hi' }),
      ).rejects.toBeInstanceOf(EmailProviderNotConfiguredException);
      expect(resendConstructorMock).not.toHaveBeenCalled();
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('maps provider errors to safe typed errors without leaking secrets', async () => {
      const provider = createProvider();
      const send = (): Promise<unknown> =>
        provider.sendEmail({ to: 'a@example.com', subject: 'Hi', text: 'Hi' });

      sendMock.mockResolvedValue({
        data: null,
        error: {
          name: 'invalid_api_key',
          message: 'API key re_test_key is invalid',
          statusCode: 401,
        },
      });
      await expect(send()).rejects.toBeInstanceOf(EmailProviderNotConfiguredException);

      sendMock.mockResolvedValue({
        data: null,
        error: { name: 'rate_limit_exceeded', message: 'Too many requests', statusCode: 429 },
      });
      await expect(send()).rejects.toBeInstanceOf(EmailProviderUnavailableException);

      sendMock.mockResolvedValue({
        data: null,
        error: { name: 'validation_error', message: 'Invalid to address', statusCode: 422 },
      });
      const rejection = await send().catch((error: unknown) => error);
      expect(rejection).toBeInstanceOf(EmailProviderRejectedException);
      expect(
        JSON.stringify((rejection as EmailProviderRejectedException).getResponse()),
      ).not.toContain('re_test_key');
    });
  });

  describe('sendBatch', () => {
    it('sends up to 100 emails in one SDK call with a batch idempotency key', async () => {
      batchSendMock.mockResolvedValue({
        data: { data: [{ id: 'msg_a' }, { id: 'msg_b' }] },
        error: null,
      });
      const provider = createProvider();

      const results = await provider.sendBatch(
        [
          { to: 'a@example.com', subject: 'One', html: '<p>1</p>' },
          { to: 'b@example.com', subject: 'Two', text: '2' },
        ],
        { idempotencyKey: 'batch/1' },
      );

      expect(batchSendMock).toHaveBeenCalledTimes(1);
      const [payload, options] = batchSendMock.mock.calls[0] as [
        Record<string, unknown>[],
        { idempotencyKey: string },
      ];
      expect(payload).toHaveLength(2);
      expect(payload[0]).toMatchObject({ from: 'no-reply@graphology.local', to: 'a@example.com' });
      expect(options).toEqual({ idempotencyKey: 'batch/1' });
      expect(results).toEqual([
        { providerMessageId: 'msg_a', provider: 'RESEND', status: 'SENT' },
        { providerMessageId: 'msg_b', provider: 'RESEND', status: 'SENT' },
      ]);
    });

    it('rejects empty and oversized batches', async () => {
      const provider = createProvider();

      await expect(provider.sendBatch([])).rejects.toBeInstanceOf(InvalidEmailRequestException);

      const oversized = Array.from({ length: 101 }, (_, index) => ({
        to: `user${String(index)}@example.com`,
        subject: 'Bulk',
        text: 'Hi',
      }));
      await expect(provider.sendBatch(oversized)).rejects.toBeInstanceOf(
        EmailBatchLimitExceededException,
      );
      expect(batchSendMock).not.toHaveBeenCalled();
    });

    it('rejects batch entries carrying attachments or scheduling', async () => {
      const provider = createProvider();

      await expect(
        provider.sendBatch([
          {
            to: 'a@example.com',
            subject: 'Bulk',
            text: 'Hi',
            attachments: [{ filename: 'x.txt', content: 'x' }],
          } as never,
        ]),
      ).rejects.toBeInstanceOf(EmailBatchUnsupportedFieldException);
      expect(batchSendMock).not.toHaveBeenCalled();
    });
  });

  describe('verifyWebhook', () => {
    const rawBody = JSON.stringify({
      type: 'email.delivered',
      created_at: '2026-07-18T19:00:00.000Z',
      data: { email_id: 'msg_1', to: ['a@example.com'] },
    });

    it('verifies the raw body via the SDK and normalizes the event', () => {
      verifyMock.mockReturnValue({
        type: 'email.delivered',
        created_at: '2026-07-18T19:00:00.000Z',
        data: { email_id: 'msg_1', to: ['a@example.com'] },
      });
      const provider = createProvider();

      const event = provider.verifyWebhook({
        rawBody,
        svixId: 'msg_webhook_1',
        svixTimestamp: freshTimestamp(),
        svixSignature: 'v1,signature',
      });

      expect(verifyMock).toHaveBeenCalledWith({
        payload: rawBody,
        headers: {
          id: 'msg_webhook_1',
          timestamp: expect.any(String) as string,
          signature: 'v1,signature',
        },
        webhookSecret: 'whsec_test',
      });
      expect(event).toEqual({
        id: 'msg_webhook_1',
        type: 'email.delivered',
        createdAt: new Date('2026-07-18T19:00:00.000Z'),
        providerMessageId: 'msg_1',
        data: { email_id: 'msg_1', to: ['a@example.com'] },
      });
    });

    it('rejects replayed webhooks before signature verification even if valid', () => {
      verifyMock.mockReturnValue({
        type: 'email.delivered',
        created_at: '2026-07-18T19:00:00.000Z',
        data: {},
      });
      const provider = createProvider();

      expect(() =>
        provider.verifyWebhook({
          rawBody,
          svixId: 'msg_webhook_1',
          svixTimestamp: freshTimestamp(-301),
          svixSignature: 'v1,signature',
        }),
      ).toThrow(EmailWebhookReplayedException);
      expect(() =>
        provider.verifyWebhook({
          rawBody,
          svixId: 'msg_webhook_1',
          svixTimestamp: freshTimestamp(301),
          svixSignature: 'v1,signature',
        }),
      ).toThrow(EmailWebhookReplayedException);
      expect(verifyMock).not.toHaveBeenCalled();
    });

    it('accepts timestamps within a custom tolerance', () => {
      verifyMock.mockReturnValue({
        type: 'email.delivered',
        created_at: '2026-07-18T19:00:00.000Z',
        data: {},
      });
      const provider = createProvider({ EMAIL_WEBHOOK_TOLERANCE_SECONDS: 600 });

      const event = provider.verifyWebhook({
        rawBody,
        svixId: 'msg_webhook_2',
        svixTimestamp: freshTimestamp(-400),
        svixSignature: 'v1,signature',
      });
      expect(event.providerMessageId).toBeNull();
    });

    it('rejects invalid signatures, missing headers, and missing secret', () => {
      verifyMock.mockImplementation(() => {
        throw new Error('No matching signature found');
      });
      const provider = createProvider();

      expect(() =>
        provider.verifyWebhook({
          rawBody,
          svixId: 'msg_webhook_1',
          svixTimestamp: freshTimestamp(),
          svixSignature: 'v1,bad',
        }),
      ).toThrow(InvalidEmailWebhookException);

      expect(() =>
        provider.verifyWebhook({
          rawBody,
          svixId: '',
          svixTimestamp: freshTimestamp(),
          svixSignature: 'v1,signature',
        }),
      ).toThrow(InvalidEmailWebhookException);

      const withoutSecret = createProvider({ RESEND_WEBHOOK_SECRET: undefined });
      expect(() =>
        withoutSecret.verifyWebhook({
          rawBody,
          svixId: 'msg_webhook_1',
          svixTimestamp: freshTimestamp(),
          svixSignature: 'v1,signature',
        }),
      ).toThrow(EmailProviderNotConfiguredException);
    });
  });
});
