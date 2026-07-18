import { ForbiddenException } from '@nestjs/common';

export class TeacherLiveSessionMutationForbiddenException extends ForbiddenException {
  constructor(message = 'Teachers may only manage live sessions for batches they teach.') {
    super({ message, errorCode: 'TEACHER_LIVE_SESSION_MUTATION_FORBIDDEN' });
  }
}
