import { NotFoundException } from '@nestjs/common';

export class ModuleNotFoundException extends NotFoundException {
  constructor(message = 'Course module not found.') {
    super({
      message,
      errorCode: 'MODULE_NOT_FOUND',
    });
  }
}
