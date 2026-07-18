import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ENROLLMENT_REPOSITORY } from './constants/injection-tokens';
import { EnrollmentController } from './controllers/enrollment.controller';
import { PrismaEnrollmentRepository } from './repositories/prisma-enrollment.repository';
import { EnrollmentService } from './services/enrollment.service';

@Module({
  imports: [AuthModule],
  controllers: [EnrollmentController],
  providers: [
    EnrollmentService,
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
  ],
  exports: [EnrollmentService, ENROLLMENT_REPOSITORY],
})
export class EnrollmentModule {}
