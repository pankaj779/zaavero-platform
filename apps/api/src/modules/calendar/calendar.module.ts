import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CALENDAR_REPOSITORY } from './constants/injection-tokens';
import { CalendarController } from './controllers/calendar.controller';
import { PrismaCalendarRepository } from './repositories/prisma-calendar.repository';
import { CalendarService } from './services/calendar.service';

@Module({
  imports: [AuthModule],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    {
      provide: CALENDAR_REPOSITORY,
      useClass: PrismaCalendarRepository,
    },
  ],
  exports: [CalendarService, CALENDAR_REPOSITORY],
})
export class CalendarModule {}
