import { ForbiddenException } from '@nestjs/common';

export class NotificationForbiddenException extends ForbiddenException {
  constructor(message = 'You do not have access to this notification.') {
    super({
      message,
      errorCode: 'NOTIFICATION_FORBIDDEN',
    });
  }
}
