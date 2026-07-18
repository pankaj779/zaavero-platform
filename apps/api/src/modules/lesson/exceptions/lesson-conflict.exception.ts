import { ConflictException } from '@nestjs/common';

export class LessonConflictException extends ConflictException {
  constructor(message = 'A lesson conflict occurred.') {
    super({
      message,
      errorCode: 'LESSON_CONFLICT',
    });
  }
}
