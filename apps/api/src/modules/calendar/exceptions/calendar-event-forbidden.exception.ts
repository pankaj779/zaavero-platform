import { ForbiddenException } from '@nestjs/common';

export class CalendarEventForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this calendar event.') {
    super({ message, errorCode: 'CALENDAR_EVENT_FORBIDDEN' });
  }
}
