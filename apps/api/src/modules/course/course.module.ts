import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { COURSE_REPOSITORY } from './constants/injection-tokens';
import { CourseController } from './controllers/course.controller';
import { PrismaCourseRepository } from './repositories/prisma-course.repository';
import { CourseService } from './services/course.service';

@Module({
  imports: [AuthModule],
  controllers: [CourseController],
  providers: [
    CourseService,
    {
      provide: COURSE_REPOSITORY,
      useClass: PrismaCourseRepository,
    },
  ],
  exports: [CourseService, COURSE_REPOSITORY],
})
export class CourseModule {}
