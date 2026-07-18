import type {
  MediaDeliveryTypeValue,
  MediaEntityTypeValue,
  MediaResourceTypeValue,
} from '../constants/storage.constants';
import type {
  SignedUploadParameters,
  StorageProviderName,
  StorageProviderStatus,
} from '../providers/storage-provider.interface';

export interface MediaAssetResponseDto {
  id: string;
  organizationId: string;
  ownerUserId: string;
  entityType: MediaEntityTypeValue;
  entityId: string | null;
  provider: StorageProviderName;
  resourceType: MediaResourceTypeValue;
  deliveryType: MediaDeliveryTypeValue;
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

export interface SignedUploadResponseDto {
  upload: SignedUploadParameters;
  /** Provider public id the client must upload with, then echo on finalize. */
  publicId: string;
  folder: string;
}

export interface PaginatedMediaAssetsResponseDto {
  items: MediaAssetResponseDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type StorageProviderStatusResponseDto = StorageProviderStatus;
