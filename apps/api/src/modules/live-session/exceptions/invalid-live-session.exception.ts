import { BadRequestException } from '@nestjs/common';

export class InvalidLiveSessionException extends BadRequestException {
  constructor(message = 'Invalid live session request.') {
    super({ message, errorCode: 'INVALID_LIVE_SESSION' });
  }
}
