import { NotFoundException } from '@nestjs/common';

export class CourseNotFoundException extends NotFoundException {
  constructor(message = 'Course not found.') {
    super({
      message,
      errorCode: 'COURSE_NOT_FOUND',
    });
  }
}
