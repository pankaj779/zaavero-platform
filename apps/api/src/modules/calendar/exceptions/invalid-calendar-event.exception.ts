import { BadRequestException } from '@nestjs/common';

export class InvalidCalendarEventException extends BadRequestException {
  constructor(message = 'The calendar event request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_CALENDAR_EVENT',
    });
  }
}
