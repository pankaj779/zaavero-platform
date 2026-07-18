import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export class EmailProviderNotConfiguredException extends ServiceUnavailableException {
  constructor(message = 'The email provider is not configured. Contact the administrator.') {
    super({ message, errorCode: 'EMAIL_PROVIDER_NOT_CONFIGURED' });
  }
}

export class EmailProviderUnavailableException extends ServiceUnavailableException {
  constructor(message = 'The email provider is temporarily unavailable. Try again later.') {
    super({ message, errorCode: 'EMAIL_PROVIDER_UNAVAILABLE' });
  }
}

export class EmailProviderRejectedException extends BadGatewayException {
  constructor(message = 'The email provider rejected the request.') {
    super({ message, errorCode: 'EMAIL_PROVIDER_REJECTED' });
  }
}

export class InvalidEmailRequestException extends BadRequestException {
  constructor(message = 'The email request is invalid.') {
    super({ message, errorCode: 'INVALID_EMAIL_REQUEST' });
  }
}

export class EmailBatchLimitExceededException extends BadRequestException {
  constructor(message = 'A batch send is limited to 100 emails per request.') {
    super({ message, errorCode: 'EMAIL_BATCH_LIMIT_EXCEEDED' });
  }
}

export class EmailBatchUnsupportedFieldException extends BadRequestException {
  constructor(
    message = 'Batch emails do not support attachments or scheduled delivery. Send them individually.',
  ) {
    super({ message, errorCode: 'EMAIL_BATCH_UNSUPPORTED_FIELD' });
  }
}

export class InvalidEmailWebhookException extends UnauthorizedException {
  constructor(message = 'The email webhook signature is missing or invalid.') {
    super({ message, errorCode: 'INVALID_EMAIL_WEBHOOK' });
  }
}

export class EmailWebhookReplayedException extends UnauthorizedException {
  constructor(message = 'The email webhook timestamp is outside the accepted replay window.') {
    super({ message, errorCode: 'EMAIL_WEBHOOK_REPLAYED' });
  }
}
