import { BadRequestException } from '@nestjs/common';

export class BatchInvalidScheduleException extends BadRequestException {
  constructor(message = 'startDate must be before endDate.') {
    super({
      message,
      errorCode: 'BATCH_INVALID_SCHEDULE',
    });
  }
}
