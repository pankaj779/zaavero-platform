import { extname } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import {
  DANGEROUS_FILE_EXTENSIONS,
  DEFAULT_STORAGE_ALLOWED_MIME_TYPES,
  type MediaResourceTypeValue,
} from '../constants/storage.constants';
import { InvalidStorageFileException } from '../exceptions';
import type { StorageResourceType } from '../providers/storage-provider.interface';

/** Extensions each MIME type may legitimately carry. */
const MIME_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'text/plain': ['txt'],
  'application/zip': ['zip'],
};

export interface StorageFileDescriptor {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export function fileExtension(filename: string): string {
  return extname(filename).slice(1).toLowerCase();
}

export function validateStorageFile(
  file: StorageFileDescriptor,
  config: ConfigService<EnvConfig, true>,
  options: { serverUpload?: boolean } = {},
): void {
  const extension = fileExtension(file.filename);
  if (!extension || DANGEROUS_FILE_EXTENSIONS.has(extension)) {
    throw new InvalidStorageFileException('The file extension is missing or not allowed.');
  }

  const configured = config.get('STORAGE_ALLOWED_MIME_TYPES', { infer: true });
  const allowedMimes = new Set(
    (configured ?? DEFAULT_STORAGE_ALLOWED_MIME_TYPES.join(','))
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const mimeType = file.mimeType.toLowerCase();
  if (!allowedMimes.has(mimeType)) {
    throw new InvalidStorageFileException(`Files of type ${mimeType} are not allowed.`);
  }
  const expectedExtensions = MIME_EXTENSIONS[mimeType];
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    throw new InvalidStorageFileException('The file extension does not match its MIME type.');
  }

  const maxBytes = options.serverUpload
    ? config.get('STORAGE_SERVER_UPLOAD_MAX_BYTES', { infer: true })
    : config.get('STORAGE_MAX_FILE_SIZE_BYTES', { infer: true });
  if (file.sizeBytes <= 0 || file.sizeBytes > maxBytes) {
    throw new InvalidStorageFileException(
      `The file size must be between 1 and ${String(maxBytes)} bytes.`,
    );
  }
}

export function providerResourceType(mimeType: string): StorageResourceType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
}

export function persistedResourceType(resourceType: StorageResourceType): MediaResourceTypeValue {
  if (resourceType === 'image') return 'IMAGE';
  if (resourceType === 'video') return 'VIDEO';
  return 'RAW';
}

/** Sanitizes a value for use as a Cloudinary folder/public id segment. */
export function safeStorageSegment(value: string): string {
  const safe = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!safe) {
    throw new InvalidStorageFileException('A storage path segment is invalid.');
  }
  return safe.slice(0, 100);
}
