import type { MediaAssetRecord } from '../interfaces/storage-repository.interface';
import type { MediaAssetResponseDto } from '../dto/storage-response.dto';

export class StorageMapper {
  static pageMeta(total: number, page: number, limit: number) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Maps a persisted asset to its API shape. Never exposes provider internals. */
  static asset(record: MediaAssetRecord): MediaAssetResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      ownerUserId: record.ownerUserId,
      entityType: record.entityType,
      entityId: record.entityId,
      provider: record.provider,
      resourceType: record.resourceType,
      deliveryType: record.deliveryType,
      publicId: record.providerPublicId,
      url: record.secureUrl,
      originalFilename: record.originalFilename,
      mimeType: record.mimeType,
      extension: record.extension,
      sizeBytes: Number(record.bytes),
      checksumSha256: record.checksumSha256,
      width: record.width,
      height: record.height,
      durationSeconds: record.durationSeconds,
      format: record.format,
      version: record.version,
      tags: record.tags,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
