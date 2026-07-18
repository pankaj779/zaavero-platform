import { ForbiddenException } from '@nestjs/common';

export class CourseTeacherProfileRequiredException extends ForbiddenException {
  constructor(message = 'A teacher profile is required in this organization to manage courses.') {
    super({
      message,
      errorCode: 'COURSE_TEACHER_PROFILE_REQUIRED',
    });
  }
}
