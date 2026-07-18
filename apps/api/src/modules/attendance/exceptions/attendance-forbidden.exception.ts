import { ForbiddenException } from '@nestjs/common';

export class AttendanceForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this attendance record.') {
    super({ message, errorCode: 'ATTENDANCE_FORBIDDEN' });
  }
}
