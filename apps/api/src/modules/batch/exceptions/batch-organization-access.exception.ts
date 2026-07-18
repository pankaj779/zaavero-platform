import { ForbiddenException } from '@nestjs/common';

export class BatchOrganizationAccessException extends ForbiddenException {
  constructor(message = 'You do not have access to this organization.') {
    super({
      message,
      errorCode: 'BATCH_ORGANIZATION_ACCESS_DENIED',
    });
  }
}
