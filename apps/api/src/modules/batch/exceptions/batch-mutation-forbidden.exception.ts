import { ForbiddenException } from '@nestjs/common';

export class BatchMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You are not allowed to modify this batch.') {
    super({
      message,
      errorCode: 'BATCH_MUTATION_FORBIDDEN',
    });
  }
}
