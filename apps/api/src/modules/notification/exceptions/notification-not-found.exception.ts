import { NotFoundException } from '@nestjs/common';

export class NotificationNotFoundException extends NotFoundException {
  constructor(message = 'Notification not found.') {
    super({
      message,
      errorCode: 'NOTIFICATION_NOT_FOUND',
    });
  }
}
