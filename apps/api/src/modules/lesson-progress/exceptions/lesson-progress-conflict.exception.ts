import { ConflictException } from '@nestjs/common';

export class LessonProgressConflictException extends ConflictException {
  constructor(message = 'Lesson progress already exists for this student and lesson.') {
    super({ message, errorCode: 'LESSON_PROGRESS_CONFLICT' });
  }
}
