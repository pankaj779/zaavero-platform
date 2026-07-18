import { ForbiddenException } from '@nestjs/common';

export class CourseOrganizationAccessException extends ForbiddenException {
  constructor(message = 'You do not have access to this organization.') {
    super({
      message,
      errorCode: 'COURSE_ORGANIZATION_ACCESS_DENIED',
    });
  }
}
