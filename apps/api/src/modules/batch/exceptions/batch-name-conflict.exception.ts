import { ConflictException } from '@nestjs/common';

export class BatchNameConflictException extends ConflictException {
  constructor(message = 'A batch with this name already exists for the course.') {
    super({
      message,
      errorCode: 'BATCH_NAME_CONFLICT',
    });
  }
}
