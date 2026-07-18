import { BadRequestException } from '@nestjs/common';

export class InvalidNotificationException extends BadRequestException {
  constructor(message = 'The notification request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_NOTIFICATION',
    });
  }
}
