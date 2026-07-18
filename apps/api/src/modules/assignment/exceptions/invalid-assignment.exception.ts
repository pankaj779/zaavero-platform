import { BadRequestException } from '@nestjs/common';

export class InvalidAssignmentException extends BadRequestException {
  constructor(message = 'The assignment request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_ASSIGNMENT',
    });
  }
}
