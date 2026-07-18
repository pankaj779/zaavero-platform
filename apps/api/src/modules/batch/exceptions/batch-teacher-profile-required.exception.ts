import { ForbiddenException } from '@nestjs/common';

export class BatchTeacherProfileRequiredException extends ForbiddenException {
  constructor(message = 'A teacher profile is required in this organization to manage batches.') {
    super({
      message,
      errorCode: 'BATCH_TEACHER_PROFILE_REQUIRED',
    });
  }
}
