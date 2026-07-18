import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SUBMISSION_REPOSITORY } from './constants/injection-tokens';
import { SubmissionController } from './controllers/submission.controller';
import { PrismaSubmissionRepository } from './repositories/prisma-submission.repository';
import { SubmissionService } from './services/submission.service';

@Module({
  imports: [AuthModule],
  controllers: [SubmissionController],
  providers: [
    SubmissionService,
    {
      provide: SUBMISSION_REPOSITORY,
      useClass: PrismaSubmissionRepository,
    },
  ],
  exports: [SubmissionService, SUBMISSION_REPOSITORY],
})
export class SubmissionModule {}
