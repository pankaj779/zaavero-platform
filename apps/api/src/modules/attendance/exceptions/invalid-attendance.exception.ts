import { BadRequestException } from '@nestjs/common';

export class InvalidAttendanceException extends BadRequestException {
  constructor(message = 'The attendance request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_ATTENDANCE',
    });
  }
}
