import { NotFoundException } from '@nestjs/common';

export class CalendarEventNotFoundException extends NotFoundException {
  constructor(message = 'Calendar event not found.') {
    super({
      message,
      errorCode: 'CALENDAR_EVENT_NOT_FOUND',
    });
  }
}
