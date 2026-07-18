import type {
  MediaDeliveryTypeValue,
  MediaEntityTypeValue,
  MediaResourceTypeValue,
} from '../constants/storage.constants';
import type { StorageProviderName } from '../providers/storage-provider.interface';

/** Mirrors the persisted MediaAsset row (bytes widened to bigint by Prisma). */
export interface MediaAssetRecord {
  id: string;
  organizationId: string;
  ownerUserId: string;
  entityType: MediaEntityTypeValue;
  entityId: string | null;
  provider: StorageProviderName;
  resourceType: MediaResourceTypeValue;
  deliveryType: MediaDeliveryTypeValue;
  providerPublicId: string;
  providerAssetId: string | null;
  folder: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  bytes: bigint;
  checksumSha256: string;
  providerEtag: string | null;
  secureUrl: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  format: string | null;
  version: number;
  tags: string[];
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateMediaAssetData {
  organizationId: string;
  ownerUserId: string;
  entityType: MediaEntityTypeValue;
  entityId?: string;
  provider: StorageProviderName;
  resourceType: MediaResourceTypeValue;
  deliveryType: MediaDeliveryTypeValue;
  providerPublicId: string;
  providerAssetId?: string;
  folder: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  bytes: number;
  checksumSha256: string;
  providerEtag?: string;
  secureUrl: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  format?: string;
  version: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ReplaceMediaAssetData {
  provider: StorageProviderName;
  resourceType: MediaResourceTypeValue;
  providerPublicId: string;
  providerAssetId?: string;
  folder: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  bytes: number;
  checksumSha256: string;
  providerEtag?: string;
  secureUrl: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  format?: string;
  version: number;
}

export interface MediaAssetListFilters {
  organizationId: string;
  entityType?: MediaEntityTypeValue;
  entityId?: string;
  page: number;
  limit: number;
}

export interface StorageAuditEntry {
  userId: string;
  action: string;
  entityId: string;
  metadata: Record<string, unknown> & { organizationId: string };
}

export interface StorageRepository {
  create(data: CreateMediaAssetData): Promise<MediaAssetRecord>;
  findById(organizationId: string, id: string): Promise<MediaAssetRecord | null>;
  findBySecureUrl(organizationId: string, secureUrl: string): Promise<MediaAssetRecord | null>;
  /**
   * Checksum dedupe is deliberately scoped to the same organization, owner,
   * entity type, and entity so that files (e.g. submissions) are never shared
   * across users or entities.
   */
  findByChecksum(scope: {
    organizationId: string;
    ownerUserId: string;
    entityType: MediaEntityTypeValue;
    entityId?: string;
    checksumSha256: string;
  }): Promise<MediaAssetRecord | null>;
  list(filters: MediaAssetListFilters): Promise<{ items: MediaAssetRecord[]; total: number }>;
  replace(
    organizationId: string,
    id: string,
    data: ReplaceMediaAssetData,
  ): Promise<MediaAssetRecord | null>;
  softDelete(organizationId: string, id: string): Promise<MediaAssetRecord | null>;
  audit(entry: StorageAuditEntry): Promise<void>;
}
