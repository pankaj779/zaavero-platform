import { BadRequestException } from '@nestjs/common';

export class BatchInvalidCapacityException extends BadRequestException {
  constructor(message = 'maxStudents must be greater than zero.') {
    super({
      message,
      errorCode: 'BATCH_INVALID_CAPACITY',
    });
  }
}
