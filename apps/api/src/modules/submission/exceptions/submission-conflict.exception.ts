import { ConflictException } from '@nestjs/common';

export class SubmissionConflictException extends ConflictException {
  constructor(message = 'This student already has a submission for this assignment.') {
    super({
      message,
      errorCode: 'SUBMISSION_CONFLICT',
    });
  }
}
