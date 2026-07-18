export const STORAGE_ENTITY_TYPES = [
  'USER_AVATAR',
  'ORG_LOGO',
  'ORG_BRANDING',
  'COURSE_THUMBNAIL',
  'COURSE_BANNER',
  'LESSON_VIDEO',
  'LESSON_PDF',
  'LESSON_ZIP',
  'LESSON_ATTACHMENT',
  'ASSIGNMENT_ATTACHMENT',
  'SUBMISSION_ATTACHMENT',
  'CERTIFICATE_PDF',
  'CERTIFICATE_QR',
  'INVOICE_PDF',
  'MESSAGE_ATTACHMENT',
  'ANNOUNCEMENT_IMAGE',
  'CALENDAR_ATTACHMENT',
  'OTHER',
] as const;

export type StorageEntityType = (typeof STORAGE_ENTITY_TYPES)[number];
export type StorageProviderName = 'CLOUDINARY' | 'SANDBOX';
export type StorageResourceType = 'IMAGE' | 'VIDEO' | 'RAW';

export interface StorageAssetApiRecord {
  id: string;
  organizationId: string;
  ownerUserId: string;
  entityType: StorageEntityType;
  entityId: string | null;
  provider: StorageProviderName;
  resourceType: StorageResourceType;
  deliveryType: 'UPLOAD' | 'PRIVATE' | 'AUTHENTICATED';
  publicId: string;
  url: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  checksumSha256: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  format: string | null;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StorageAsset {
  id: string;
  organizationId: string;
  entityType: StorageEntityType;
  entityId: string | null;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  provider: StorageProviderName;
}

export function mapStorageAsset(record: StorageAssetApiRecord): StorageAsset {
  return {
    id: record.id,
    organizationId: record.organizationId,
    entityType: record.entityType,
    entityId: record.entityId,
    url: record.url,
    filename: record.originalFilename,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    width: record.width,
    height: record.height,
    durationSeconds: record.durationSeconds,
    provider: record.provider,
  };
}
