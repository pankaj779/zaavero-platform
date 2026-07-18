import { NotFoundException } from '@nestjs/common';

export class AttendanceNotFoundException extends NotFoundException {
  constructor(message = 'Attendance not found.') {
    super({
      message,
      errorCode: 'ATTENDANCE_NOT_FOUND',
    });
  }
}
