import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NOTIFICATION_REPOSITORY } from './constants/injection-tokens';
import { NotificationController } from './controllers/notification.controller';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationService, NOTIFICATION_REPOSITORY],
})
export class NotificationModule {}
