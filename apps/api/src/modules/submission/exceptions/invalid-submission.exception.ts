import { BadRequestException } from '@nestjs/common';

export class InvalidSubmissionException extends BadRequestException {
  constructor(message = 'The submission request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_SUBMISSION',
    });
  }
}
