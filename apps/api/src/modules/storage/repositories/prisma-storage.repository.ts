import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import { STORAGE_AUDIT_ENTITY } from '../constants/storage.constants';
import type {
  CreateMediaAssetData,
  MediaAssetListFilters,
  MediaAssetRecord,
  ReplaceMediaAssetData,
  StorageAuditEntry,
  StorageRepository,
} from '../interfaces/storage-repository.interface';

const assetSelect = {
  id: true,
  organizationId: true,
  ownerUserId: true,
  entityType: true,
  entityId: true,
  provider: true,
  resourceType: true,
  deliveryType: true,
  providerPublicId: true,
  providerAssetId: true,
  folder: true,
  originalFilename: true,
  mimeType: true,
  extension: true,
  bytes: true,
  checksumSha256: true,
  providerEtag: true,
  secureUrl: true,
  width: true,
  height: true,
  durationSeconds: true,
  format: true,
  version: true,
  tags: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaStorageRepository implements StorageRepository {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async create(data: CreateMediaAssetData): Promise<MediaAssetRecord> {
    return this.prisma.mediaAsset.create({
      data: {
        organizationId: data.organizationId,
        ownerUserId: data.ownerUserId,
        entityType: data.entityType,
        entityId: data.entityId,
        provider: data.provider,
        resourceType: data.resourceType,
        deliveryType: data.deliveryType,
        providerPublicId: data.providerPublicId,
        providerAssetId: data.providerAssetId,
        folder: data.folder,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        extension: data.extension,
        bytes: BigInt(data.bytes),
        checksumSha256: data.checksumSha256,
        providerEtag: data.providerEtag,
        secureUrl: data.secureUrl,
        width: data.width,
        height: data.height,
        durationSeconds: data.durationSeconds,
        format: data.format,
        version: data.version,
        tags: data.tags ?? [],
        metadata: data.metadata as never,
      },
      select: assetSelect,
    });
  }

  async findById(organizationId: string, id: string): Promise<MediaAssetRecord | null> {
    return this.prisma.mediaAsset.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: assetSelect,
    });
  }

  async findBySecureUrl(
    organizationId: string,
    secureUrl: string,
  ): Promise<MediaAssetRecord | null> {
    return this.prisma.mediaAsset.findFirst({
      where: { secureUrl, organizationId, deletedAt: null },
      select: assetSelect,
    });
  }

  async findByChecksum(scope: {
    organizationId: string;
    ownerUserId: string;
    entityType: MediaAssetRecord['entityType'];
    entityId?: string;
    checksumSha256: string;
  }): Promise<MediaAssetRecord | null> {
    return this.prisma.mediaAsset.findFirst({
      where: {
        organizationId: scope.organizationId,
        ownerUserId: scope.ownerUserId,
        entityType: scope.entityType,
        entityId: scope.entityId ?? null,
        checksumSha256: scope.checksumSha256,
        deletedAt: null,
      },
      select: assetSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async list(
    filters: MediaAssetListFilters,
  ): Promise<{ items: MediaAssetRecord[]; total: number }> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        select: assetSelect,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return { items, total };
  }

  async replace(
    organizationId: string,
    id: string,
    data: ReplaceMediaAssetData,
  ): Promise<MediaAssetRecord | null> {
    const result = await this.prisma.mediaAsset.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: {
        provider: data.provider,
        resourceType: data.resourceType,
        providerPublicId: data.providerPublicId,
        providerAssetId: data.providerAssetId ?? null,
        folder: data.folder,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        extension: data.extension,
        bytes: BigInt(data.bytes),
        checksumSha256: data.checksumSha256,
        providerEtag: data.providerEtag ?? null,
        secureUrl: data.secureUrl,
        width: data.width ?? null,
        height: data.height ?? null,
        durationSeconds: data.durationSeconds ?? null,
        format: data.format ?? null,
        version: data.version,
      },
    });
    if (result.count !== 1) return null;
    return this.findById(organizationId, id);
  }

  async softDelete(organizationId: string, id: string): Promise<MediaAssetRecord | null> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return null;
    await this.prisma.mediaAsset.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return existing;
  }

  async audit(entry: StorageAuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: STORAGE_AUDIT_ENTITY,
        entityId: entry.entityId,
        metadata: entry.metadata as never,
      },
    });
  }
}
