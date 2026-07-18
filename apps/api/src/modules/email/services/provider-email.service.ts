import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_PROVIDER } from '../constants/injection-tokens';
import type { EmailService, SendEmailInput } from '../interfaces/email-service.interface';
import type { EmailProvider } from '../providers/email-provider.interface';

/**
 * Legacy EmailService adapter. Existing callers (auth flows) keep the simple
 * sendEmail contract while delivery goes through the active EmailProvider
 * (Resend in production, sandbox locally). The full Phase 12 EmailService
 * (templates/queue/logging) will also build on EmailProvider.
 */
@Injectable()
export class ProviderEmailService implements EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  async sendEmail(input: SendEmailInput): Promise<void> {
    await this.emailProvider.sendEmail({
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
