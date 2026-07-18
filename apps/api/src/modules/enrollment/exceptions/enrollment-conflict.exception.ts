import { ConflictException } from '@nestjs/common';

export class EnrollmentConflictException extends ConflictException {
  constructor(message = 'This student is already enrolled in the batch.') {
    super({
      message,
      errorCode: 'ENROLLMENT_CONFLICT',
    });
  }
}
