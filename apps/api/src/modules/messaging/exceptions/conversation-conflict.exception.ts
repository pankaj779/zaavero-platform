import { ConflictException } from '@nestjs/common';

export class ConversationConflictException extends ConflictException {
  constructor(message = 'The user is already a participant in this conversation.') {
    super({
      message,
      errorCode: 'CONVERSATION_CONFLICT',
    });
  }
}
