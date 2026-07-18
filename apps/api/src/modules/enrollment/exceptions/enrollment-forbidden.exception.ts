import { ForbiddenException } from '@nestjs/common';

export class EnrollmentForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this enrollment.') {
    super({ message, errorCode: 'ENROLLMENT_FORBIDDEN' });
  }
}
