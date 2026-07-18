import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LESSON_REPOSITORY } from './constants/injection-tokens';
import { LessonController } from './controllers/lesson.controller';
import { PrismaLessonRepository } from './repositories/prisma-lesson.repository';
import { LessonService } from './services/lesson.service';

@Module({
  imports: [AuthModule],
  controllers: [LessonController],
  providers: [LessonService, { provide: LESSON_REPOSITORY, useClass: PrismaLessonRepository }],
  exports: [LessonService, LESSON_REPOSITORY],
})
export class LessonModule {}
