import { createHash, randomUUID } from 'node:crypto';
import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { AUTH_PERMISSIONS } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { STORAGE_AUDIT_ACTIONS, type MediaEntityTypeValue } from '../constants/storage.constants';
import { STORAGE_PROVIDER_TOKEN, STORAGE_REPOSITORY } from '../constants/injection-tokens';
import type {
  FinalizeStorageUploadDto,
  ListStorageAssetsQueryDto,
  ServerStorageUploadDto,
  SignStorageUploadDto,
} from '../dto/storage.dto';
import type {
  MediaAssetResponseDto,
  PaginatedMediaAssetsResponseDto,
  SignedUploadResponseDto,
  StorageProviderStatusResponseDto,
} from '../dto/storage-response.dto';
import {
  InvalidStorageFileException,
  InvalidStorageUploadException,
  StorageAssetNotFoundException,
} from '../exceptions';
import type {
  MediaAssetRecord,
  StorageRepository,
} from '../interfaces/storage-repository.interface';
import { StorageMapper } from '../mappers/storage.mapper';
import type {
  ProviderUploadResult,
  StorageProvider,
} from '../providers/storage-provider.interface';
import {
  fileExtension,
  persistedResourceType,
  providerResourceType,
  safeStorageSegment,
  validateStorageFile,
} from './storage-validation';

/**
 * Entity types any authenticated member may upload for themselves. All other
 * entity types are organization-managed content and require storage.upload.
 */
const SELF_SERVICE_ENTITY_TYPES: ReadonlySet<MediaEntityTypeValue> = new Set([
  'USER_AVATAR',
  'SUBMISSION_ATTACHMENT',
  'MESSAGE_ATTACHMENT',
  'OTHER',
]);

export interface UploadedFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ResolveMediaAssetOptions {
  organizationId: string;
  entityType: MediaEntityTypeValue;
  ownerUserId?: string;
}

export interface DownloadAuthorizedAssetInput {
  organizationId: string;
  assetId: string;
  allowedEntityTypes: readonly MediaEntityTypeValue[];
  allowedMimePrefixes?: readonly string[];
  maxBytes?: number;
}

export interface GeneratedAssetInput {
  organizationId: string;
  ownerUserId: string;
  entityType: MediaEntityTypeValue;
  entityId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly provider: StorageProvider,
    @Inject(STORAGE_REPOSITORY)
    private readonly repository: StorageRepository,
  ) {}

  getProviderStatus(): StorageProviderStatusResponseDto {
    return this.provider.getStatus();
  }

  createSignedUpload(user: AuthenticatedUser, dto: SignStorageUploadDto): SignedUploadResponseDto {
    this.assertOrganizationAccess(user, dto.organizationId);
    this.assertUploadPermission(user, dto.entityType);
    validateStorageFile(
      { filename: dto.filename, mimeType: dto.mimeType, sizeBytes: dto.sizeBytes },
      this.configService,
    );

    const folder = this.buildFolder(dto.organizationId, dto.entityType);
    const publicId = randomUUID();
    const ttlSeconds = this.configService.get('STORAGE_SIGNED_UPLOAD_TTL_SECONDS', {
      infer: true,
    });
    const upload = this.provider.createSignedUpload({
      folder,
      publicId,
      resourceType: providerResourceType(dto.mimeType),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      tags: dto.tags,
    });

    return { upload, publicId: `${folder}/${publicId}`, folder };
  }

  async finalizeDirectUpload(
    user: AuthenticatedUser,
    dto: FinalizeStorageUploadDto,
  ): Promise<MediaAssetResponseDto> {
    this.assertOrganizationAccess(user, dto.organizationId);
    this.assertUploadPermission(user, dto.entityType);
    validateStorageFile(
      { filename: dto.filename, mimeType: dto.mimeType, sizeBytes: dto.sizeBytes },
      this.configService,
    );

    // The public id must sit inside this organization's folder; otherwise a
    // caller could register provider assets belonging to another tenant.
    const expectedFolder = this.buildFolder(dto.organizationId, dto.entityType);
    if (!dto.publicId.startsWith(`${expectedFolder}/`)) {
      throw new InvalidStorageUploadException(
        'The public id does not belong to this organization and entity type.',
      );
    }

    const resourceType = providerResourceType(dto.mimeType);
    const verified = await this.provider.verifyUploadedAsset({
      publicId: dto.publicId,
      resourceType,
      expectedBytes: dto.sizeBytes,
    });

    const duplicate = await this.repository.findByChecksum({
      organizationId: dto.organizationId,
      ownerUserId: user.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      checksumSha256: dto.checksumSha256.toLowerCase(),
    });
    if (duplicate) {
      // Keep the earlier record; remove the redundant provider upload.
      await this.deleteFromProviderSafely(verified);
      return StorageMapper.asset(duplicate);
    }

    const record = await this.persistUpload(user, dto, verified, dto.checksumSha256.toLowerCase());
    return StorageMapper.asset(record);
  }

  async uploadBuffer(
    user: AuthenticatedUser,
    dto: ServerStorageUploadDto,
    file: UploadedFileInput | undefined,
  ): Promise<MediaAssetResponseDto> {
    if (!file || file.size === 0) {
      throw new InvalidStorageFileException('A file is required.');
    }
    this.assertOrganizationAccess(user, dto.organizationId);
    this.assertUploadPermission(user, dto.entityType);
    validateStorageFile(
      { filename: file.originalname, mimeType: file.mimetype, sizeBytes: file.size },
      this.configService,
      { serverUpload: true },
    );

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await this.repository.findByChecksum({
      organizationId: dto.organizationId,
      ownerUserId: user.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      checksumSha256: checksum,
    });
    if (duplicate) {
      return StorageMapper.asset(duplicate);
    }

    const folder = this.buildFolder(dto.organizationId, dto.entityType);
    const uploaded = await this.provider.uploadBuffer({
      buffer: file.buffer,
      folder,
      publicId: randomUUID(),
      filename: file.originalname,
      mimeType: file.mimetype,
      resourceType: providerResourceType(file.mimetype),
      tags: dto.tags,
    });

    const record = await this.persistUpload(
      user,
      {
        organizationId: dto.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        tags: dto.tags,
        metadata: dto.metadata,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      uploaded,
      checksum,
    );
    return StorageMapper.asset(record);
  }

  /**
   * Trusted server-side upload path for generated artifacts. Callers must
   * provide the owning user explicitly; no request-scoped user is fabricated.
   */
  async uploadGeneratedAsset(input: GeneratedAssetInput): Promise<MediaAssetResponseDto> {
    const sizeBytes = input.buffer.byteLength;
    validateStorageFile(
      { filename: input.filename, mimeType: input.mimeType, sizeBytes },
      this.configService,
      { serverUpload: true },
    );

    const checksumSha256 = createHash('sha256').update(input.buffer).digest('hex');
    const duplicate = await this.repository.findByChecksum({
      organizationId: input.organizationId,
      ownerUserId: input.ownerUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      checksumSha256,
    });
    if (duplicate) return StorageMapper.asset(duplicate);

    const folder = this.buildFolder(input.organizationId, input.entityType);
    const uploaded = await this.provider.uploadBuffer({
      buffer: input.buffer,
      folder,
      publicId: randomUUID(),
      filename: input.filename,
      mimeType: input.mimeType,
      resourceType: providerResourceType(input.mimeType),
      tags: input.tags,
    });
    const record = await this.repository.create({
      organizationId: input.organizationId,
      ownerUserId: input.ownerUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      provider: uploaded.provider,
      resourceType: persistedResourceType(uploaded.resourceType),
      deliveryType: 'UPLOAD',
      providerPublicId: uploaded.publicId,
      providerAssetId: uploaded.providerAssetId ?? undefined,
      folder,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      extension: fileExtension(input.filename),
      bytes: sizeBytes,
      checksumSha256,
      providerEtag: uploaded.etag,
      secureUrl: uploaded.secureUrl,
      width: uploaded.width,
      height: uploaded.height,
      durationSeconds: uploaded.durationSeconds,
      format: uploaded.format,
      version: uploaded.version,
      tags: input.tags,
      metadata: input.metadata,
    });
    await this.repository.audit({
      userId: null,
      action: STORAGE_AUDIT_ACTIONS.upload,
      entityId: record.id,
      metadata: {
        organizationId: input.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        publicId: uploaded.publicId,
        mimeType: input.mimeType,
        sizeBytes,
        provider: uploaded.provider,
        generated: true,
      },
    });
    return StorageMapper.asset(record);
  }

  async getAsset(
    user: AuthenticatedUser,
    organizationId: string,
    id: string,
  ): Promise<MediaAssetResponseDto> {
    this.assertOrganizationAccess(user, organizationId);
    const record = await this.repository.findById(organizationId, id);
    if (!record) throw new StorageAssetNotFoundException();
    return StorageMapper.asset(record);
  }

  /**
   * Resolves an asset id or an already-issued secure URL to the canonical URL
   * after enforcing tenant and media-purpose boundaries.
   */
  async resolveAssetUrl(reference: string, options: ResolveMediaAssetOptions): Promise<string> {
    const normalized = reference.trim();
    const isHttpsUrl = normalized.startsWith('https://');
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);
    if (!isHttpsUrl && !isUuid) {
      throw new InvalidStorageUploadException(
        'Media references must be a MediaAsset id or an existing secure storage URL.',
      );
    }

    const asset = isHttpsUrl
      ? await this.repository.findBySecureUrl(options.organizationId, normalized)
      : await this.repository.findById(options.organizationId, normalized);
    if (asset?.entityType !== options.entityType) {
      throw new InvalidStorageUploadException(
        `Media must belong to this organization and have entity type ${options.entityType}.`,
      );
    }
    if (options.ownerUserId && asset.ownerUserId !== options.ownerUserId) {
      throw new InvalidStorageUploadException('Media must be owned by the current user.');
    }
    return asset.secureUrl;
  }

  async resolveAssetUrls(
    references: readonly string[] | undefined,
    options: ResolveMediaAssetOptions,
  ): Promise<string[] | undefined> {
    if (references === undefined) return undefined;
    return Promise.all(references.map((reference) => this.resolveAssetUrl(reference, options)));
  }

  /**
   * Downloads an authorized media asset for server-side processing (e.g. RAG indexing).
   * Enforces organization, entity type, MIME, and size boundaries.
   */
  async downloadAuthorizedAsset(input: DownloadAuthorizedAssetInput): Promise<{
    buffer: Buffer;
    mimeType: string;
    bytes: number;
    asset: MediaAssetRecord;
  }> {
    const record = await this.repository.findById(input.organizationId, input.assetId);
    if (!record || record.deletedAt) {
      throw new StorageAssetNotFoundException();
    }
    if (!input.allowedEntityTypes.includes(record.entityType)) {
      throw new InvalidStorageUploadException(
        `Asset entity type ${record.entityType} is not permitted for this operation.`,
      );
    }
    const mimeType = record.mimeType.toLowerCase();
    if (input.allowedMimePrefixes?.length) {
      const allowed = input.allowedMimePrefixes.some((prefix) => mimeType.startsWith(prefix));
      if (!allowed) {
        throw new InvalidStorageFileException('Asset MIME type is not permitted for this operation.');
      }
    }
    const sizeBytes = Number(record.bytes);
    const maxBytes =
      input.maxBytes ??
      this.configService.get('STORAGE_MAX_FILE_SIZE_BYTES', { infer: true }) ??
      100 * 1024 * 1024;
    if (sizeBytes > maxBytes) {
      throw new InvalidStorageFileException('Asset exceeds the maximum allowed download size.');
    }
    const downloaded = await this.provider.downloadBuffer({
      secureUrl: record.secureUrl,
      publicId: record.providerPublicId,
      resourceType: providerResourceType(record.mimeType),
    });
    return { ...downloaded, asset: record };
  }

  async listAssets(
    user: AuthenticatedUser,
    query: ListStorageAssetsQueryDto,
  ): Promise<PaginatedMediaAssetsResponseDto> {
    this.assertOrganizationAccess(user, query.organizationId);
    const result = await this.repository.list({
      organizationId: query.organizationId,
      entityType: query.entityType,
      entityId: query.entityId,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map((record) => StorageMapper.asset(record)),
      meta: StorageMapper.pageMeta(result.total, query.page, query.limit),
    };
  }

  async replaceAsset(
    user: AuthenticatedUser,
    organizationId: string,
    id: string,
    file: UploadedFileInput | undefined,
  ): Promise<MediaAssetResponseDto> {
    if (!file || file.size === 0) {
      throw new InvalidStorageFileException('A replacement file is required.');
    }
    this.assertOrganizationAccess(user, organizationId);
    const existing = await this.repository.findById(organizationId, id);
    if (!existing) throw new StorageAssetNotFoundException();
    this.assertCanManageAsset(user, existing);
    validateStorageFile(
      { filename: file.originalname, mimeType: file.mimetype, sizeBytes: file.size },
      this.configService,
      { serverUpload: true },
    );

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const folder = this.buildFolder(organizationId, existing.entityType);
    const uploaded = await this.provider.uploadBuffer({
      buffer: file.buffer,
      folder,
      publicId: randomUUID(),
      filename: file.originalname,
      mimeType: file.mimetype,
      resourceType: providerResourceType(file.mimetype),
      tags: existing.tags,
    });

    const updated = await this.repository.replace(organizationId, id, {
      provider: uploaded.provider,
      resourceType: persistedResourceType(uploaded.resourceType),
      providerPublicId: uploaded.publicId,
      providerAssetId: uploaded.providerAssetId ?? undefined,
      folder,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      extension: fileExtension(file.originalname),
      bytes: file.size,
      checksumSha256: checksum,
      providerEtag: uploaded.etag,
      secureUrl: uploaded.secureUrl,
      width: uploaded.width,
      height: uploaded.height,
      durationSeconds: uploaded.durationSeconds,
      format: uploaded.format,
      version: uploaded.version,
    });
    if (!updated) {
      await this.deleteFromProviderSafely(uploaded);
      throw new StorageAssetNotFoundException();
    }

    // Best-effort removal of the previous provider asset.
    await this.deleteFromProviderSafely({
      publicId: existing.providerPublicId,
      resourceType: providerResourceType(existing.mimeType),
    });

    await this.repository.audit({
      userId: user.id,
      action: STORAGE_AUDIT_ACTIONS.replace,
      entityId: id,
      metadata: {
        organizationId,
        entityType: existing.entityType,
        entityId: existing.entityId,
        previousPublicId: existing.providerPublicId,
        publicId: uploaded.publicId,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });

    return StorageMapper.asset(updated);
  }

  async deleteAsset(
    user: AuthenticatedUser,
    organizationId: string,
    id: string,
  ): Promise<{ deleted: boolean }> {
    this.assertOrganizationAccess(user, organizationId);
    const existing = await this.repository.findById(organizationId, id);
    if (!existing) throw new StorageAssetNotFoundException();
    this.assertCanManageAsset(user, existing);

    const deleted = await this.repository.softDelete(organizationId, id);
    if (!deleted) throw new StorageAssetNotFoundException();

    await this.deleteFromProviderSafely({
      publicId: existing.providerPublicId,
      resourceType: providerResourceType(existing.mimeType),
    });

    await this.repository.audit({
      userId: user.id,
      action: STORAGE_AUDIT_ACTIONS.delete,
      entityId: id,
      metadata: {
        organizationId,
        entityType: existing.entityType,
        entityId: existing.entityId,
        publicId: existing.providerPublicId,
        sizeBytes: Number(existing.bytes),
      },
    });

    return { deleted: true };
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async persistUpload(
    user: AuthenticatedUser,
    dto: ServerStorageUploadDto & { filename: string; mimeType: string; sizeBytes: number },
    uploaded: ProviderUploadResult,
    checksumSha256: string,
  ): Promise<MediaAssetRecord> {
    const record = await this.repository.create({
      organizationId: dto.organizationId,
      ownerUserId: user.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      provider: uploaded.provider,
      resourceType: persistedResourceType(uploaded.resourceType),
      deliveryType: 'UPLOAD',
      providerPublicId: uploaded.publicId,
      providerAssetId: uploaded.providerAssetId ?? undefined,
      folder: this.buildFolder(dto.organizationId, dto.entityType),
      originalFilename: dto.filename,
      mimeType: dto.mimeType,
      extension: fileExtension(dto.filename),
      bytes: dto.sizeBytes,
      checksumSha256,
      providerEtag: uploaded.etag,
      secureUrl: uploaded.secureUrl,
      width: uploaded.width,
      height: uploaded.height,
      durationSeconds: uploaded.durationSeconds,
      format: uploaded.format,
      version: uploaded.version,
      tags: dto.tags,
      metadata: dto.metadata,
    });

    await this.repository.audit({
      userId: user.id,
      action: STORAGE_AUDIT_ACTIONS.upload,
      entityId: record.id,
      metadata: {
        organizationId: dto.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        publicId: uploaded.publicId,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        provider: uploaded.provider,
      },
    });

    return record;
  }

  private buildFolder(organizationId: string, entityType: MediaEntityTypeValue): string {
    const root = this.configService.get('CLOUDINARY_FOLDER_ROOT', { infer: true });
    return `${safeStorageSegment(root)}/${organizationId}/${entityType.toLowerCase()}`;
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new ForbiddenException('You do not have access to this organization.');
    }
  }

  private assertUploadPermission(user: AuthenticatedUser, entityType: MediaEntityTypeValue): void {
    if (SELF_SERVICE_ENTITY_TYPES.has(entityType)) return;
    if (
      user.permissions.includes(AUTH_PERMISSIONS.storageUpload) ||
      user.permissions.includes(AUTH_PERMISSIONS.storageManage)
    ) {
      return;
    }
    throw new ForbiddenException('You do not have permission to upload this type of media.');
  }

  private assertCanManageAsset(user: AuthenticatedUser, asset: MediaAssetRecord): void {
    if (asset.ownerUserId === user.id) return;
    if (user.permissions.includes(AUTH_PERMISSIONS.storageManage)) return;
    throw new ForbiddenException('You do not have permission to manage this asset.');
  }

  private async deleteFromProviderSafely(asset: {
    publicId: string;
    resourceType: ProviderUploadResult['resourceType'];
  }): Promise<void> {
    try {
      await this.provider.delete(asset.publicId, asset.resourceType);
    } catch {
      this.logger.warn(`Provider cleanup failed for ${asset.publicId}; continuing.`);
    }
  }
}
