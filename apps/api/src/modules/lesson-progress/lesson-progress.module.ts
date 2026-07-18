import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LESSON_PROGRESS_REPOSITORY } from './constants/injection-tokens';
import { LessonProgressController } from './controllers/lesson-progress.controller';
import { PrismaLessonProgressRepository } from './repositories/prisma-lesson-progress.repository';
import { LessonProgressService } from './services/lesson-progress.service';

@Module({
  imports: [AuthModule],
  controllers: [LessonProgressController],
  providers: [
    LessonProgressService,
    { provide: LESSON_PROGRESS_REPOSITORY, useClass: PrismaLessonProgressRepository },
  ],
  exports: [LessonProgressService, LESSON_PROGRESS_REPOSITORY],
})
export class LessonProgressModule {}
