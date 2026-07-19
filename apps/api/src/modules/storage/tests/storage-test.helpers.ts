import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import type { EnvConfig } from '../../../config/env.schema';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type {
  MediaAssetRecord,
  StorageRepository,
} from '../interfaces/storage-repository.interface';
import type { StorageProvider } from '../providers/storage-provider.interface';

export const ORG_ID = '018f65a0-0000-7000-8000-000000000001';
export const OTHER_ORG_ID = '018f65a0-0000-7000-8000-000000000002';
export const USER_ID = '018f65a0-0000-7000-8000-0000000000aa';
export const OTHER_USER_ID = '018f65a0-0000-7000-8000-0000000000bb';
export const ASSET_ID = '018f65a0-0000-7000-8000-0000000000cc';

export function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: USER_ID,
    email: 'user@example.com',
    roles: ['Teacher'],
    permissions: ['storage.upload'],
    organizationIds: [ORG_ID],
    ...overrides,
  };
}

export function createConfig(overrides: Partial<EnvConfig> = {}): ConfigService<EnvConfig, true> {
  return new ConfigService<EnvConfig, true>({
    NODE_ENV: 'test',
    CLOUDINARY_FOLDER_ROOT: 'graphology',
    STORAGE_SIGNED_UPLOAD_TTL_SECONDS: 600,
    STORAGE_MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024,
    STORAGE_SERVER_UPLOAD_MAX_BYTES: 10 * 1024 * 1024,
    ...overrides,
  });
}

export function createAssetRecord(overrides: Partial<MediaAssetRecord> = {}): MediaAssetRecord {
  return {
    id: ASSET_ID,
    organizationId: ORG_ID,
    ownerUserId: USER_ID,
    entityType: 'USER_AVATAR',
    entityId: null,
    provider: 'SANDBOX',
    resourceType: 'IMAGE',
    deliveryType: 'UPLOAD',
    providerPublicId: `graphology/${ORG_ID}/user_avatar/abc`,
    providerAssetId: 'asset-1',
    folder: `graphology/${ORG_ID}/user_avatar`,
    originalFilename: 'avatar.png',
    mimeType: 'image/png',
    extension: 'png',
    bytes: BigInt(2048),
    checksumSha256: 'a'.repeat(64),
    providerEtag: 'etag-1',
    secureUrl: 'https://sandbox.storage.local/abc',
    width: 128,
    height: 128,
    durationSeconds: null,
    format: 'png',
    version: 1,
    tags: [],
    metadata: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

export interface RepositoryMock extends StorageRepository {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findBySecureUrl: ReturnType<typeof vi.fn>;
  findByChecksum: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  softDelete: ReturnType<typeof vi.fn>;
  audit: ReturnType<typeof vi.fn>;
}

export function createRepositoryMock(): RepositoryMock {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findBySecureUrl: vi.fn(),
    findByChecksum: vi.fn(),
    list: vi.fn(),
    replace: vi.fn(),
    softDelete: vi.fn(),
    audit: vi.fn().mockResolvedValue(undefined),
  };
}

export interface ProviderMock extends StorageProvider {
  createSignedUpload: ReturnType<typeof vi.fn>;
  uploadBuffer: ReturnType<typeof vi.fn>;
  verifyUploadedAsset: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

export function createProviderMock(): ProviderMock {
  return {
    name: 'SANDBOX',
    isConfigured: vi.fn().mockReturnValue(true),
    getStatus: vi.fn().mockReturnValue({
      provider: 'SANDBOX',
      configured: true,
      sandbox: true,
      directUploads: true,
    }),
    createSignedUpload: vi.fn(),
    uploadBuffer: vi.fn(),
    verifyUploadedAsset: vi.fn(),
    downloadBuffer: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}
