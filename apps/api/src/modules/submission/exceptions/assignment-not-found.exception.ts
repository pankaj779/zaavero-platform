import { NotFoundException } from '@nestjs/common';

export class AssignmentNotFoundException extends NotFoundException {
  constructor(message = 'Assignment not found.') {
    super({
      message,
      errorCode: 'ASSIGNMENT_NOT_FOUND',
    });
  }
}
