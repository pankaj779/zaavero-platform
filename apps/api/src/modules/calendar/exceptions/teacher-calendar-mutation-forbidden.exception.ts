import { ForbiddenException } from '@nestjs/common';

export class TeacherCalendarMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You may only manage calendar events you own.') {
    super({
      message,
      errorCode: 'TEACHER_CALENDAR_MUTATION_FORBIDDEN',
    });
  }
}
