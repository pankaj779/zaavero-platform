import { BadRequestException } from '@nestjs/common';

export class InvalidCertificateException extends BadRequestException {
  constructor(message = 'The certificate request is invalid.') {
    super({
      message,
      errorCode: 'INVALID_CERTIFICATE',
    });
  }
}
