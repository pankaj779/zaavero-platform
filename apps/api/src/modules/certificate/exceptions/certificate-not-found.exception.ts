import { NotFoundException } from '@nestjs/common';

export class CertificateNotFoundException extends NotFoundException {
  constructor(message = 'Certificate not found.') {
    super({
      message,
      errorCode: 'CERTIFICATE_NOT_FOUND',
    });
  }
}
