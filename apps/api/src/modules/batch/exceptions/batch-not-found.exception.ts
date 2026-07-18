import { NotFoundException } from '@nestjs/common';

export class BatchNotFoundException extends NotFoundException {
  constructor(message = 'Batch not found.') {
    super({
      message,
      errorCode: 'BATCH_NOT_FOUND',
    });
  }
}
