import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class StorageProviderNotConfiguredException extends ServiceUnavailableException {
  constructor(message = 'The storage provider is not configured.') {
    super({ message, errorCode: 'STORAGE_PROVIDER_NOT_CONFIGURED' });
  }
}

export class StorageProviderException extends BadGatewayException {
  constructor(message = 'The storage provider rejected the request.') {
    super({ message, errorCode: 'STORAGE_PROVIDER_ERROR' });
  }
}

export class InvalidStorageFileException extends BadRequestException {
  constructor(message = 'The file is not allowed.') {
    super({ message, errorCode: 'INVALID_STORAGE_FILE' });
  }
}

export class InvalidStorageUploadException extends BadRequestException {
  constructor(message = 'The upload result could not be verified.') {
    super({ message, errorCode: 'INVALID_STORAGE_UPLOAD' });
  }
}

export class StorageAssetNotFoundException extends NotFoundException {
  constructor() {
    super({ message: 'Storage asset not found.', errorCode: 'STORAGE_ASSET_NOT_FOUND' });
  }
}

export class StorageAssetConflictException extends ConflictException {
  constructor(message = 'The storage asset could not be changed.') {
    super({ message, errorCode: 'STORAGE_ASSET_CONFLICT' });
  }
}
