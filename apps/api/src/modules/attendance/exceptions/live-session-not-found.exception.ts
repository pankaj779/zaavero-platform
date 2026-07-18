import { NotFoundException } from '@nestjs/common';

export class LiveSessionNotFoundException extends NotFoundException {
  constructor(message = 'Live session not found.') {
    super({
      message,
      errorCode: 'ATTENDANCE_LIVE_SESSION_NOT_FOUND',
    });
  }
}
