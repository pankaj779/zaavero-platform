import { ForbiddenException } from '@nestjs/common';

export class TeacherAttendanceMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You may only manage attendance for live sessions in batches you teach.') {
    super({
      message,
      errorCode: 'TEACHER_ATTENDANCE_MUTATION_FORBIDDEN',
    });
  }
}
