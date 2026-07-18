import { BadRequestException } from '@nestjs/common';

export class InvalidLessonProgressException extends BadRequestException {
  constructor(message = 'Invalid lesson progress request.') {
    super({ message, errorCode: 'INVALID_LESSON_PROGRESS' });
  }
}
