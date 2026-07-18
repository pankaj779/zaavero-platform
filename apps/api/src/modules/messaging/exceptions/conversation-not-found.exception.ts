import { NotFoundException } from '@nestjs/common';

export class ConversationNotFoundException extends NotFoundException {
  constructor(message = 'Conversation not found.') {
    super({
      message,
      errorCode: 'CONVERSATION_NOT_FOUND',
    });
  }
}
