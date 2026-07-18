import { ForbiddenException } from '@nestjs/common';

export class LessonProgressForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this lesson progress.') {
    super({ message, errorCode: 'LESSON_PROGRESS_FORBIDDEN' });
  }
}
