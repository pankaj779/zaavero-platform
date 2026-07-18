import { BadRequestException } from '@nestjs/common';

export class InvalidLessonException extends BadRequestException {
  constructor(message = 'Invalid lesson request.') {
    super({
      message,
      errorCode: 'INVALID_LESSON',
    });
  }
}
