import { NotFoundException } from '@nestjs/common';

export class LessonNotFoundException extends NotFoundException {
  constructor(message = 'Lesson not found.') {
    super({ message, errorCode: 'LESSON_NOT_FOUND' });
  }
}
