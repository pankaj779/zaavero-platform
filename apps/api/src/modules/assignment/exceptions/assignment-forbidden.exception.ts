import { ForbiddenException } from '@nestjs/common';

export class AssignmentForbiddenException extends ForbiddenException {
  constructor(message = 'You cannot access this assignment.') {
    super({ message, errorCode: 'ASSIGNMENT_FORBIDDEN' });
  }
}
