import { NotFoundException } from '@nestjs/common';

export class BatchCourseNotFoundException extends NotFoundException {
  constructor(message = 'Course not found in this organization.') {
    super({
      message,
      errorCode: 'BATCH_COURSE_NOT_FOUND',
    });
  }
}
