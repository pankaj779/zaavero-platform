import { ForbiddenException } from '@nestjs/common';

export class SubmissionForbiddenException extends ForbiddenException {
  constructor(message = 'You are not allowed to perform this submission action.') {
    super({
      message,
      errorCode: 'SUBMISSION_FORBIDDEN',
    });
  }
}
