import { NotFoundException } from '@nestjs/common';

export class StudentProfileNotFoundException extends NotFoundException {
  constructor(message = 'Student profile not found.') {
    super({
      message,
      errorCode: 'ATTENDANCE_STUDENT_PROFILE_NOT_FOUND',
    });
  }
}
