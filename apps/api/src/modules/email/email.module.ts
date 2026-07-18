import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import type { EnvConfig } from '../../config/env.schema';
import { AuthModule } from '../auth/auth.module';
import {
  EMAIL_PROVIDER,
  EMAIL_REPOSITORY,
  EMAIL_SERVICE,
  INVITATION_REPOSITORY,
} from './constants/injection-tokens';
import { EmailAdminController } from './controllers/email-admin.controller';
import { EmailInvitationController } from './controllers/email-invitation.controller';
import { EmailPreferenceController } from './controllers/email-preference.controller';
import { EmailWebhookController } from './controllers/email-webhook.controller';
import { resolveEmailProvider } from './providers/email-provider.factory';
import type { EmailProvider } from './providers/email-provider.interface';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { SandboxEmailProvider } from './providers/sandbox-email.provider';
import { PrismaEmailRepository } from './repositories/prisma-email.repository';
import { PrismaInvitationRepository } from './repositories/prisma-invitation.repository';
import { EmailAdminService } from './services/email-admin.service';
import { BusinessEmailService } from './services/business-email.service';
import { EmailPreferenceService } from './services/email-preference.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailWebhookService } from './services/email-webhook.service';
import { EmailWorkerService } from './services/email-worker.service';
import { InvitationService } from './services/invitation.service';
import { ProviderEmailService } from './services/provider-email.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), forwardRef(() => AuthModule)],
  controllers: [
    EmailWebhookController,
    EmailPreferenceController,
    EmailAdminController,
    EmailInvitationController,
  ],
  providers: [
    ResendEmailProvider,
    SandboxEmailProvider,
    EmailService,
    BusinessEmailService,
    EmailTemplateService,
    EmailPreferenceService,
    EmailQueueService,
    EmailWorkerService,
    EmailWebhookService,
    EmailAdminService,
    InvitationService,
    {
      provide: EMAIL_REPOSITORY,
      useClass: PrismaEmailRepository,
    },
    {
      provide: EMAIL_PROVIDER,
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
        resendProvider: ResendEmailProvider,
        sandboxProvider: SandboxEmailProvider,
      ): EmailProvider =>
        resolveEmailProvider(
          {
            NODE_ENV: configService.get('NODE_ENV', { infer: true }),
            EMAIL_PROVIDER: configService.get('EMAIL_PROVIDER', { infer: true }),
            EMAIL_SANDBOX_MODE: configService.get('EMAIL_SANDBOX_MODE', { infer: true }),
          },
          resendProvider,
          sandboxProvider,
        ),
      inject: [ConfigService, ResendEmailProvider, SandboxEmailProvider],
    },
    {
      provide: INVITATION_REPOSITORY,
      useClass: PrismaInvitationRepository,
    },
    {
      provide: EMAIL_SERVICE,
      useClass: ProviderEmailService,
    },
  ],
  exports: [EmailService, BusinessEmailService, EMAIL_PROVIDER, EMAIL_SERVICE, EMAIL_REPOSITORY],
})
export class EmailModule {}
