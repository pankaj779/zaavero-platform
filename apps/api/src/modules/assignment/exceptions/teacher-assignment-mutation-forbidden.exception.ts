import { ForbiddenException } from '@nestjs/common';

export class TeacherAssignmentMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You may only manage assignments for courses or batches you teach.') {
    super({
      message,
      errorCode: 'TEACHER_ASSIGNMENT_MUTATION_FORBIDDEN',
    });
  }
}
