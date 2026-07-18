import { ForbiddenException } from '@nestjs/common';

export class OrganizationAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this organization.') {
    super({
      message,
      errorCode: 'ORGANIZATION_ACCESS_DENIED',
    });
  }
}
