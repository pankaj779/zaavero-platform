import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export class MeetingProviderNotConfiguredException extends ServiceUnavailableException {
  constructor(message = 'The meeting provider is not configured for this organization.') {
    super({ message, errorCode: 'MEETING_PROVIDER_NOT_CONFIGURED' });
  }
}

export class MeetingProviderUnavailableException extends ServiceUnavailableException {
  constructor(message = 'The meeting provider is temporarily unavailable.') {
    super({ message, errorCode: 'MEETING_PROVIDER_UNAVAILABLE' });
  }
}

export class MeetingProviderRejectedException extends BadGatewayException {
  constructor(message = 'The meeting provider rejected the request.') {
    super({ message, errorCode: 'MEETING_PROVIDER_REJECTED' });
  }
}

export class InvalidMeetingRequestException extends BadRequestException {
  constructor(message = 'The meeting request is invalid.') {
    super({ message, errorCode: 'INVALID_MEETING_REQUEST' });
  }
}

export class MeetingSandboxForbiddenException extends ForbiddenException {
  constructor(message = 'Sandbox meeting provider is not allowed in production.') {
    super({ message, errorCode: 'MEETING_SANDBOX_FORBIDDEN' });
  }
}

export class MeetingIntegrationNotFoundException extends NotFoundException {
  constructor(message = 'Meeting integration was not found.') {
    super({ message, errorCode: 'MEETING_INTEGRATION_NOT_FOUND' });
  }
}

export class MeetingOAuthStateInvalidException extends UnauthorizedException {
  constructor(message = 'Meeting OAuth state is invalid or expired.') {
    super({ message, errorCode: 'MEETING_OAUTH_STATE_INVALID' });
  }
}

export class InvalidMeetingWebhookException extends UnauthorizedException {
  constructor(message = 'Meeting webhook signature is invalid.') {
    super({ message, errorCode: 'INVALID_MEETING_WEBHOOK' });
  }
}

export class MeetingTokenEncryptionException extends ServiceUnavailableException {
  constructor(message = 'Meeting token encryption is not configured.') {
    super({ message, errorCode: 'MEETING_TOKEN_ENCRYPTION_UNAVAILABLE' });
  }
}

export class OrganizationAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this organization.') {
    super({ message, errorCode: 'ORGANIZATION_ACCESS_DENIED' });
  }
}
