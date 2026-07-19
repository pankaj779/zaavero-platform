import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class AIProviderNotConfiguredException extends ServiceUnavailableException {
  constructor(message = 'The AI provider is not configured.') {
    super({ message, errorCode: 'AI_PROVIDER_NOT_CONFIGURED' });
  }
}

export class AIProviderUnavailableException extends ServiceUnavailableException {
  constructor(message = 'The AI provider is temporarily unavailable.') {
    super({ message, errorCode: 'AI_PROVIDER_UNAVAILABLE' });
  }
}

export class AIProviderRejectedException extends BadGatewayException {
  constructor(message = 'The AI provider rejected the request.') {
    super({ message, errorCode: 'AI_PROVIDER_REJECTED' });
  }
}

export class InvalidAIRequestException extends BadRequestException {
  constructor(message = 'The AI request is invalid.') {
    super({ message, errorCode: 'INVALID_AI_REQUEST' });
  }
}

export class AISandboxForbiddenException extends ForbiddenException {
  constructor(message = 'Sandbox AI provider cannot serve user-facing generations.') {
    super({ message, errorCode: 'AI_SANDBOX_FORBIDDEN' });
  }
}

export class AIConversationNotFoundException extends NotFoundException {
  constructor(message = 'AI conversation was not found.') {
    super({ message, errorCode: 'AI_CONVERSATION_NOT_FOUND' });
  }
}

export class AIQuotaExceededException extends HttpException {
  constructor(message = 'AI token quota has been exceeded.') {
    super({ message, errorCode: 'AI_QUOTA_EXCEEDED' }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class AISafetyViolationException extends BadRequestException {
  constructor(message = 'The AI request was blocked by safety checks.') {
    super({ message, errorCode: 'AI_SAFETY_VIOLATION' });
  }
}

export class OrganizationAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this organization.') {
    super({ message, errorCode: 'ORGANIZATION_ACCESS_DENIED' });
  }
}
