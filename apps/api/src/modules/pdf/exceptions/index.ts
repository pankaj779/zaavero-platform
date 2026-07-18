import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export class PdfEntityNotFoundException extends NotFoundException {
  constructor(entity: string) {
    super({
      message: `${entity} not found.`,
      errorCode: 'PDF_ENTITY_NOT_FOUND',
    });
  }
}

export class PdfGenerationFailedException extends ServiceUnavailableException {
  constructor(message = 'PDF generation failed. Try again later.') {
    super({
      message,
      errorCode: 'PDF_GENERATION_FAILED',
    });
  }
}
