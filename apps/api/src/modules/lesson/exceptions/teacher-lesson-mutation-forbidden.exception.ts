import { ForbiddenException } from '@nestjs/common';

export class TeacherLessonMutationForbiddenException extends ForbiddenException {
  constructor(message = 'Teachers may only manage lessons in courses they own.') {
    super({
      message,
      errorCode: 'TEACHER_LESSON_MUTATION_FORBIDDEN',
    });
  }
}
