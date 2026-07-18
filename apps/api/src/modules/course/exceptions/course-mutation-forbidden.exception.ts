import { ForbiddenException } from '@nestjs/common';

export class CourseMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You are not allowed to modify this course.') {
    super({
      message,
      errorCode: 'COURSE_MUTATION_FORBIDDEN',
    });
  }
}
