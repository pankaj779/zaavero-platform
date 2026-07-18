import { ConflictException } from '@nestjs/common';

export class CertificateConflictException extends ConflictException {
  constructor(message = 'Could not generate a unique certificate identifier.') {
    super({
      message,
      errorCode: 'CERTIFICATE_CONFLICT',
    });
  }
}
