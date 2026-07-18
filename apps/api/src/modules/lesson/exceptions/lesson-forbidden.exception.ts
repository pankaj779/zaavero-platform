import { ForbiddenException } from '@nestjs/common';

export class LessonForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this lesson.') {
    super({ message, errorCode: 'LESSON_FORBIDDEN' });
  }
}
