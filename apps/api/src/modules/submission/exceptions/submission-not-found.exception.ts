import { NotFoundException } from '@nestjs/common';

export class SubmissionNotFoundException extends NotFoundException {
  constructor(message = 'Submission not found.') {
    super({
      message,
      errorCode: 'SUBMISSION_NOT_FOUND',
    });
  }
}
