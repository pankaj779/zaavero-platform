import { NotFoundException } from '@nestjs/common';

export class LessonProgressNotFoundException extends NotFoundException {
  constructor(message = 'Lesson progress not found.') {
    super({ message, errorCode: 'LESSON_PROGRESS_NOT_FOUND' });
  }
}
