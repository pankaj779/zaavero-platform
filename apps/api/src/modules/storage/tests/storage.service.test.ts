import { createHash } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  InvalidStorageFileException,
  InvalidStorageUploadException,
  StorageAssetNotFoundException,
} from '../exceptions';
import type { StorageAuditEntry } from '../interfaces/storage-repository.interface';
import type { ProviderUploadResult } from '../providers/storage-provider.interface';
import { StorageService } from '../services/storage.service';
import {
  ASSET_ID,
  createAssetRecord,
  createConfig,
  createProviderMock,
  createRepositoryMock,
  createUser,
  ORG_ID,
  OTHER_ORG_ID,
  OTHER_USER_ID,
  type ProviderMock,
  type RepositoryMock,
} from './storage-test.helpers';

const uploadResult: ProviderUploadResult = {
  provider: 'SANDBOX',
  providerAssetId: 'asset-1',
  publicId: `graphology/${ORG_ID}/user_avatar/new`,
  secureUrl: 'https://sandbox.storage.local/new',
  resourceType: 'image',
  bytes: 11,
  width: 10,
  height: 10,
  format: 'png',
  etag: 'etag-new',
  version: 1,
};

describe('StorageService', () => {
  let provider: ProviderMock;
  let repository: RepositoryMock;
  let service: StorageService;

  beforeEach(() => {
    provider = createProviderMock();
    repository = createRepositoryMock();
    service = new StorageService(createConfig(), provider, repository);
  });

  describe('createSignedUpload', () => {
    it('returns signed parameters with an org-scoped public id', () => {
      provider.createSignedUpload.mockReturnValue({
        provider: 'SANDBOX',
        uploadUrl: 'sandbox://uploads',
        fields: {},
        expiresAt: new Date().toISOString(),
      });

      const result = service.createSignedUpload(createUser(), {
        organizationId: ORG_ID,
        entityType: 'USER_AVATAR',
        filename: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: 2048,
      });

      expect(result.folder).toBe(`graphology/${ORG_ID}/user_avatar`);
      expect(result.publicId.startsWith(`graphology/${ORG_ID}/user_avatar/`)).toBe(true);
      expect(provider.createSignedUpload).toHaveBeenCalledWith(
        expect.objectContaining({ folder: `graphology/${ORG_ID}/user_avatar` }),
      );
    });

    it('rejects users outside the organization', () => {
      expect(() =>
        service.createSignedUpload(createUser({ organizationIds: [OTHER_ORG_ID] }), {
          organizationId: ORG_ID,
          entityType: 'USER_AVATAR',
          filename: 'avatar.png',
          mimeType: 'image/png',
          sizeBytes: 2048,
        }),
      ).toThrow(ForbiddenException);
    });

    it('requires storage.upload for organization-managed entity types', () => {
      expect(() =>
        service.createSignedUpload(createUser({ permissions: [] }), {
          organizationId: ORG_ID,
          entityType: 'COURSE_THUMBNAIL',
          filename: 'thumb.png',
          mimeType: 'image/png',
          sizeBytes: 2048,
        }),
      ).toThrow(ForbiddenException);
      // Self-service types stay open to any authenticated member.
      provider.createSignedUpload.mockReturnValue({
        provider: 'SANDBOX',
        uploadUrl: 'sandbox://uploads',
        fields: {},
        expiresAt: new Date().toISOString(),
      });
      expect(() =>
        service.createSignedUpload(createUser({ permissions: [] }), {
          organizationId: ORG_ID,
          entityType: 'USER_AVATAR',
          filename: 'avatar.png',
          mimeType: 'image/png',
          sizeBytes: 2048,
        }),
      ).not.toThrow();
    });

    it('rejects disallowed MIME types, extensions, and oversized files', () => {
      const base = {
        organizationId: ORG_ID,
        entityType: 'USER_AVATAR' as const,
      };
      expect(() =>
        service.createSignedUpload(createUser(), {
          ...base,
          filename: 'run.exe',
          mimeType: 'application/octet-stream',
          sizeBytes: 100,
        }),
      ).toThrow(InvalidStorageFileException);
      expect(() =>
        service.createSignedUpload(createUser(), {
          ...base,
          filename: 'avatar.png',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
        }),
      ).toThrow(InvalidStorageFileException);
      expect(() =>
        service.createSignedUpload(createUser(), {
          ...base,
          filename: 'avatar.png',
          mimeType: 'image/png',
          sizeBytes: 200 * 1024 * 1024,
        }),
      ).toThrow(InvalidStorageFileException);
    });
  });

  describe('resolveAssetUrl', () => {
    it('rejects arbitrary URLs that are not registered MediaAssets', async () => {
      repository.findBySecureUrl.mockResolvedValue(null);

      await expect(
        service.resolveAssetUrl('https://evil.example/file.pdf', {
          organizationId: ORG_ID,
          entityType: 'SUBMISSION_ATTACHMENT',
        }),
      ).rejects.toBeInstanceOf(InvalidStorageUploadException);
    });

    it('rejects an asset registered for a different entity type', async () => {
      repository.findById.mockResolvedValue(createAssetRecord({ entityType: 'USER_AVATAR' }));

      await expect(
        service.resolveAssetUrl(ASSET_ID, {
          organizationId: ORG_ID,
          entityType: 'MESSAGE_ATTACHMENT',
        }),
      ).rejects.toBeInstanceOf(InvalidStorageUploadException);
    });

    it('returns the canonical secure URL for a matching asset id', async () => {
      const asset = createAssetRecord({ entityType: 'MESSAGE_ATTACHMENT' });
      repository.findById.mockResolvedValue(asset);

      await expect(
        service.resolveAssetUrl(ASSET_ID, {
          organizationId: ORG_ID,
          entityType: 'MESSAGE_ATTACHMENT',
          ownerUserId: asset.ownerUserId,
        }),
      ).resolves.toBe(asset.secureUrl);
    });
  });

  describe('finalizeDirectUpload', () => {
    const dto = {
      organizationId: ORG_ID,
      entityType: 'USER_AVATAR' as const,
      filename: 'avatar.png',
      mimeType: 'image/png',
      sizeBytes: 11,
      publicId: `graphology/${ORG_ID}/user_avatar/new`,
      checksumSha256: 'A'.repeat(64),
    };

    it('verifies the provider asset, persists it, and audits the upload', async () => {
      provider.verifyUploadedAsset.mockResolvedValue(uploadResult);
      repository.findByChecksum.mockResolvedValue(null);
      repository.create.mockResolvedValue(createAssetRecord());

      const result = await service.finalizeDirectUpload(createUser(), dto);

      expect(provider.verifyUploadedAsset).toHaveBeenCalledWith({
        publicId: dto.publicId,
        resourceType: 'image',
        expectedBytes: 11,
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          checksumSha256: 'a'.repeat(64),
          deliveryType: 'UPLOAD',
        }),
      );
      const auditEntry = repository.audit.mock.calls[0]?.[0] as StorageAuditEntry;
      expect(auditEntry.action).toBe('storage.asset.uploaded');
      expect(auditEntry.metadata.organizationId).toBe(ORG_ID);
      expect(result.id).toBe(ASSET_ID);
      expect(result.sizeBytes).toBe(2048);
    });

    it('rejects public ids outside the organization folder', async () => {
      await expect(
        service.finalizeDirectUpload(createUser(), {
          ...dto,
          publicId: `graphology/${OTHER_ORG_ID}/user_avatar/stolen`,
        }),
      ).rejects.toBeInstanceOf(InvalidStorageUploadException);
      expect(provider.verifyUploadedAsset).not.toHaveBeenCalled();
    });

    it('returns the existing asset on checksum duplicates and cleans up the new upload', async () => {
      provider.verifyUploadedAsset.mockResolvedValue(uploadResult);
      const existing = createAssetRecord();
      repository.findByChecksum.mockResolvedValue(existing);

      const result = await service.finalizeDirectUpload(createUser(), dto);

      expect(result.id).toBe(existing.id);
      expect(repository.create).not.toHaveBeenCalled();
      expect(provider.delete).toHaveBeenCalledWith(uploadResult.publicId, 'image');
    });
  });

  describe('uploadBuffer', () => {
    const file = {
      buffer: Buffer.from('image-bytes'),
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 11,
    };

    it('uploads through the provider and persists the asset', async () => {
      provider.uploadBuffer.mockResolvedValue(uploadResult);
      repository.findByChecksum.mockResolvedValue(null);
      repository.create.mockResolvedValue(createAssetRecord());

      const result = await service.uploadBuffer(
        createUser(),
        { organizationId: ORG_ID, entityType: 'USER_AVATAR' },
        file,
      );

      const expectedChecksum = createHash('sha256').update(file.buffer).digest('hex');
      expect(repository.findByChecksum).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          checksumSha256: expectedChecksum,
        }),
      );
      expect(provider.uploadBuffer).toHaveBeenCalledWith(
        expect.objectContaining({ folder: `graphology/${ORG_ID}/user_avatar` }),
      );
      expect(result.id).toBe(ASSET_ID);
    });

    it('dedupes identical files per owner without re-uploading', async () => {
      repository.findByChecksum.mockResolvedValue(createAssetRecord());

      const result = await service.uploadBuffer(
        createUser(),
        { organizationId: ORG_ID, entityType: 'USER_AVATAR' },
        file,
      );

      expect(result.id).toBe(ASSET_ID);
      expect(provider.uploadBuffer).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('requires a file and enforces the server upload size limit', async () => {
      await expect(
        service.uploadBuffer(
          createUser(),
          { organizationId: ORG_ID, entityType: 'USER_AVATAR' },
          undefined,
        ),
      ).rejects.toBeInstanceOf(InvalidStorageFileException);

      await expect(
        service.uploadBuffer(
          createUser(),
          { organizationId: ORG_ID, entityType: 'USER_AVATAR' },
          { ...file, size: 11 * 1024 * 1024 },
        ),
      ).rejects.toBeInstanceOf(InvalidStorageFileException);
    });
  });

  describe('getAsset / listAssets', () => {
    it('returns a mapped asset scoped to the organization', async () => {
      repository.findById.mockResolvedValue(createAssetRecord());
      const result = await service.getAsset(createUser(), ORG_ID, ASSET_ID);
      expect(result.url).toBe('https://sandbox.storage.local/abc');
      expect(repository.findById).toHaveBeenCalledWith(ORG_ID, ASSET_ID);
    });

    it('throws when the asset does not exist in the organization', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getAsset(createUser(), ORG_ID, ASSET_ID)).rejects.toBeInstanceOf(
        StorageAssetNotFoundException,
      );
    });

    it('lists assets with pagination metadata', async () => {
      repository.list.mockResolvedValue({ items: [createAssetRecord()], total: 1 });
      const result = await service.listAssets(createUser(), {
        organizationId: ORG_ID,
        entityType: 'USER_AVATAR',
        page: 1,
        limit: 20,
      });
      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('rejects listing another organization', async () => {
      await expect(
        service.listAssets(createUser(), { organizationId: OTHER_ORG_ID, page: 1, limit: 20 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('replaceAsset', () => {
    const file = {
      buffer: Buffer.from('new-bytes'),
      originalname: 'avatar2.png',
      mimetype: 'image/png',
      size: 9,
    };

    it('uploads the replacement, updates the record, deletes the old asset, and audits', async () => {
      const existing = createAssetRecord();
      repository.findById.mockResolvedValue(existing);
      provider.uploadBuffer.mockResolvedValue(uploadResult);
      repository.replace.mockResolvedValue(
        createAssetRecord({ providerPublicId: uploadResult.publicId }),
      );

      const result = await service.replaceAsset(createUser(), ORG_ID, ASSET_ID, file);

      expect(repository.replace).toHaveBeenCalledWith(
        ORG_ID,
        ASSET_ID,
        expect.objectContaining({ providerPublicId: uploadResult.publicId }),
      );
      expect(provider.delete).toHaveBeenCalledWith(existing.providerPublicId, 'image');
      expect(repository.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'storage.asset.replaced' }),
      );
      expect(result.publicId).toBe(uploadResult.publicId);
    });

    it('forbids replacing another user’s asset without storage.manage', async () => {
      repository.findById.mockResolvedValue(createAssetRecord({ ownerUserId: OTHER_USER_ID }));
      await expect(
        service.replaceAsset(createUser({ permissions: [] }), ORG_ID, ASSET_ID, file),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows storage.manage to replace assets owned by others', async () => {
      repository.findById.mockResolvedValue(createAssetRecord({ ownerUserId: OTHER_USER_ID }));
      provider.uploadBuffer.mockResolvedValue(uploadResult);
      repository.replace.mockResolvedValue(createAssetRecord());
      await expect(
        service.replaceAsset(
          createUser({ permissions: ['storage.manage'] }),
          ORG_ID,
          ASSET_ID,
          file,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('deleteAsset', () => {
    it('soft deletes, removes the provider asset, and audits', async () => {
      const existing = createAssetRecord();
      repository.findById.mockResolvedValue(existing);
      repository.softDelete.mockResolvedValue(existing);

      const result = await service.deleteAsset(createUser(), ORG_ID, ASSET_ID);

      expect(result).toEqual({ deleted: true });
      expect(repository.softDelete).toHaveBeenCalledWith(ORG_ID, ASSET_ID);
      expect(provider.delete).toHaveBeenCalledWith(existing.providerPublicId, 'image');
      const auditEntry = repository.audit.mock.calls[0]?.[0] as StorageAuditEntry;
      expect(auditEntry.action).toBe('storage.asset.deleted');
      expect(auditEntry.metadata.organizationId).toBe(ORG_ID);
    });

    it('forbids deleting another user’s asset without storage.manage', async () => {
      repository.findById.mockResolvedValue(createAssetRecord({ ownerUserId: OTHER_USER_ID }));
      await expect(
        service.deleteAsset(createUser({ permissions: [] }), ORG_ID, ASSET_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('still reports success when provider cleanup fails', async () => {
      const existing = createAssetRecord();
      repository.findById.mockResolvedValue(existing);
      repository.softDelete.mockResolvedValue(existing);
      provider.delete.mockRejectedValue(new Error('network'));

      await expect(service.deleteAsset(createUser(), ORG_ID, ASSET_ID)).resolves.toEqual({
        deleted: true,
      });
    });
  });

  it('exposes provider status', () => {
    expect(service.getProviderStatus()).toEqual({
      provider: 'SANDBOX',
      configured: true,
      sandbox: true,
      directUploads: true,
    });
  });
});
