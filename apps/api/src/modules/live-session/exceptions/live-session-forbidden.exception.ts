import { ForbiddenException } from '@nestjs/common';

export class LiveSessionForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this live session.') {
    super({ message, errorCode: 'LIVE_SESSION_FORBIDDEN' });
  }
}
