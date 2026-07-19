import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  MEETING_PROVIDER_REGISTRY,
  MEETING_REPOSITORY,
} from './constants/injection-tokens';
import { MeetingIntegrationController } from './controllers/meeting-integration.controller';
import { MeetingOAuthController } from './controllers/meeting-oauth.controller';
import { MeetingWebhookController } from './controllers/meeting-webhook.controller';
import { GoogleMeetProvider } from './providers/google-meet.provider';
import { MeetingProviderRegistry } from './providers/meeting-provider.registry';
import { SandboxMeetingProvider } from './providers/sandbox-meeting.provider';
import { ZoomMeetingProvider } from './providers/zoom-meeting.provider';
import { PrismaMeetingRepository } from './repositories/prisma-meeting.repository';
import { MeetingIntegrationService } from './services/meeting-integration.service';
import { MeetingOAuthService } from './services/meeting-oauth.service';
import { MeetingService } from './services/meeting.service';
import { MeetingTokenService } from './services/meeting-token.service';
import { MeetingWebhookService } from './services/meeting-webhook.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    MeetingIntegrationController,
    MeetingOAuthController,
    MeetingWebhookController,
  ],
  providers: [
    ZoomMeetingProvider,
    GoogleMeetProvider,
    SandboxMeetingProvider,
    MeetingProviderRegistry,
    MeetingTokenService,
    MeetingService,
    MeetingOAuthService,
    MeetingWebhookService,
    MeetingIntegrationService,
    { provide: MEETING_REPOSITORY, useClass: PrismaMeetingRepository },
    { provide: MEETING_PROVIDER_REGISTRY, useExisting: MeetingProviderRegistry },
  ],
  exports: [MeetingService, MeetingTokenService, MEETING_REPOSITORY, MEETING_PROVIDER_REGISTRY],
})
export class MeetingModule {}
