import { ForbiddenException } from '@nestjs/common';

export class CourseForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this course.') {
    super({ message, errorCode: 'COURSE_FORBIDDEN' });
  }
}
