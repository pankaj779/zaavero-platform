import { NotFoundException } from '@nestjs/common';

export class StudentProfileNotFoundException extends NotFoundException {
  constructor(message = 'Student profile not found in this organization.') {
    super({
      message,
      errorCode: 'STUDENT_PROFILE_NOT_FOUND',
    });
  }
}
