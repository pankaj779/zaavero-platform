import { BadRequestException } from '@nestjs/common';

export class InvalidConversationException extends BadRequestException {
  constructor(message = 'The conversation request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_CONVERSATION',
    });
  }
}
