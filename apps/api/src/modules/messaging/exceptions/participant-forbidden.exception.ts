import { ForbiddenException } from '@nestjs/common';

export class ParticipantForbiddenException extends ForbiddenException {
  constructor(message = 'You are not a participant in this conversation.') {
    super({
      message,
      errorCode: 'PARTICIPANT_FORBIDDEN',
    });
  }
}
