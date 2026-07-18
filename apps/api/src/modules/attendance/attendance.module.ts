import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ATTENDANCE_REPOSITORY } from './constants/injection-tokens';
import { AttendanceController } from './controllers/attendance.controller';
import { PrismaAttendanceRepository } from './repositories/prisma-attendance.repository';
import { AttendanceService } from './services/attendance.service';

@Module({
  imports: [AuthModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    {
      provide: ATTENDANCE_REPOSITORY,
      useClass: PrismaAttendanceRepository,
    },
  ],
  exports: [AttendanceService, ATTENDANCE_REPOSITORY],
})
export class AttendanceModule {}
