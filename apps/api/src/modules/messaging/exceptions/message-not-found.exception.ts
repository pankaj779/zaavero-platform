import { NotFoundException } from '@nestjs/common';

export class MessageNotFoundException extends NotFoundException {
  constructor(message = 'Message not found.') {
    super({
      message,
      errorCode: 'MESSAGE_NOT_FOUND',
    });
  }
}
