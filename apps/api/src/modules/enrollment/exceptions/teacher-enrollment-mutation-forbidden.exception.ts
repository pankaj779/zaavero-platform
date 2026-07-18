import { ForbiddenException } from '@nestjs/common';

export class TeacherEnrollmentMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You may only manage enrollments for batches you teach.') {
    super({
      message,
      errorCode: 'TEACHER_ENROLLMENT_MUTATION_FORBIDDEN',
    });
  }
}
