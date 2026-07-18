import { ConflictException } from '@nestjs/common';

export class AttendanceConflictException extends ConflictException {
  constructor(message = 'Attendance for this student in this live session already exists.') {
    super({
      message,
      errorCode: 'ATTENDANCE_CONFLICT',
    });
  }
}
