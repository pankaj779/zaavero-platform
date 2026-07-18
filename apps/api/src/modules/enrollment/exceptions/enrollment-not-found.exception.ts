import { NotFoundException } from '@nestjs/common';

export class EnrollmentNotFoundException extends NotFoundException {
  constructor(message = 'Enrollment not found.') {
    super({
      message,
      errorCode: 'ENROLLMENT_NOT_FOUND',
    });
  }
}
