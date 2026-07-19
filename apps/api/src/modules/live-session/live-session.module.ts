import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeetingModule } from '../meeting/meeting.module';
import { LIVE_SESSION_REPOSITORY } from './constants/injection-tokens';
import { LiveSessionController } from './controllers/live-session.controller';
import { PrismaLiveSessionRepository } from './repositories/prisma-live-session.repository';
import { LiveSessionService } from './services/live-session.service';

@Module({
  imports: [AuthModule, forwardRef(() => MeetingModule)],
  controllers: [LiveSessionController],
  providers: [
    LiveSessionService,
    { provide: LIVE_SESSION_REPOSITORY, useClass: PrismaLiveSessionRepository },
  ],
  exports: [LiveSessionService, LIVE_SESSION_REPOSITORY],
})
export class LiveSessionModule {}
