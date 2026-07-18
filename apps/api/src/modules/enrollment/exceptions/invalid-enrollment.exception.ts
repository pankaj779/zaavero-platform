import { BadRequestException } from '@nestjs/common';

export class InvalidEnrollmentException extends BadRequestException {
  constructor(message = 'The enrollment request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_ENROLLMENT',
    });
  }
}
