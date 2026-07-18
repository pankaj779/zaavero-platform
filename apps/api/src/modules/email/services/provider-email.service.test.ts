import { describe, expect, it, vi } from 'vitest';
import type { EmailProvider } from '../providers/email-provider.interface';
import { ProviderEmailService } from './provider-email.service';

describe('ProviderEmailService', () => {
  it('delegates legacy sendEmail calls to the active email provider', async () => {
    const sendEmail = vi.fn().mockResolvedValue({
      providerMessageId: 'msg_1',
      provider: 'RESEND',
      status: 'SENT',
    });
    const service = new ProviderEmailService({ sendEmail } as unknown as EmailProvider);

    await service.sendEmail({
      to: 'user@example.com',
      subject: 'Verify your email',
      html: '<p>Verify</p>',
      text: 'Verify',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Verify your email',
      html: '<p>Verify</p>',
      text: 'Verify',
    });
  });

  it('propagates provider failures to callers', async () => {
    const sendEmail = vi.fn().mockRejectedValue(new Error('provider down'));
    const service = new ProviderEmailService({ sendEmail } as unknown as EmailProvider);

    await expect(
      service.sendEmail({ to: 'user@example.com', subject: 'Hi', html: '<p>Hi</p>' }),
    ).rejects.toThrow('provider down');
  });
});
