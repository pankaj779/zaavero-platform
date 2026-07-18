import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MESSAGING_REPOSITORY } from './constants/injection-tokens';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { PrismaMessagingRepository } from './repositories/prisma-messaging.repository';
import { MessagingService } from './services/messaging.service';

@Module({
  imports: [AuthModule],
  controllers: [ConversationController, MessageController],
  providers: [
    MessagingService,
    {
      provide: MESSAGING_REPOSITORY,
      useClass: PrismaMessagingRepository,
    },
  ],
  exports: [MessagingService, MESSAGING_REPOSITORY],
})
export class MessagingModule {}
