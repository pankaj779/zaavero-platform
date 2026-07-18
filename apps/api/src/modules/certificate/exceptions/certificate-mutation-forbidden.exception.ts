import { ForbiddenException } from '@nestjs/common';

export class CertificateMutationForbiddenException extends ForbiddenException {
  constructor(message = 'You may only manage certificates for courses you teach.') {
    super({
      message,
      errorCode: 'CERTIFICATE_MUTATION_FORBIDDEN',
    });
  }
}
