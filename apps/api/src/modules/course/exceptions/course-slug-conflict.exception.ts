import { ConflictException } from '@nestjs/common';

export class CourseSlugConflictException extends ConflictException {
  constructor(message = 'A course with this slug already exists in the organization.') {
    super({
      message,
      errorCode: 'COURSE_SLUG_CONFLICT',
    });
  }
}
