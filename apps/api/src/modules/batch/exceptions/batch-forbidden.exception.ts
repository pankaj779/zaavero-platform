import { ForbiddenException } from '@nestjs/common';

export class BatchForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this batch.') {
    super({ message, errorCode: 'BATCH_FORBIDDEN' });
  }
}
