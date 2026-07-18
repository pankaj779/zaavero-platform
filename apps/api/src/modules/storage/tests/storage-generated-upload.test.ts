import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidStorageFileException } from '../exceptions';
import { StorageService } from '../services/storage.service';
import {
  ASSET_ID,
  ORG_ID,
  USER_ID,
  createAssetRecord,
  createConfig,
  createProviderMock,
  createRepositoryMock,
  type ProviderMock,
  type RepositoryMock,
} from './storage-test.helpers';

describe('StorageService.uploadGeneratedAsset', () => {
  let repository: RepositoryMock;
  let provider: ProviderMock;
  let service: StorageService;

  const input = {
    organizationId: ORG_ID,
    ownerUserId: USER_ID,
    entityType: 'CERTIFICATE_PDF' as const,
    entityId: ASSET_ID,
    filename: 'certificate-CERT-1.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7 test'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createRepositoryMock();
    provider = createProviderMock();
    service = new StorageService(createConfig(), provider, repository);

    provider.uploadBuffer.mockResolvedValue({
      provider: 'SANDBOX',
      publicId: 'graphology/org/certificate_pdf/abc',
      providerAssetId: 'asset-2',
      resourceType: 'raw',
      secureUrl: 'https://sandbox.storage.local/certificate.pdf',
      etag: 'etag-2',
      width: null,
      height: null,
      durationSeconds: null,
      format: 'pdf',
      version: 1,
    });
    repository.findByChecksum.mockResolvedValue(null);
    repository.create.mockResolvedValue(
      createAssetRecord({
        entityType: 'CERTIFICATE_PDF',
        mimeType: 'application/pdf',
        secureUrl: 'https://sandbox.storage.local/certificate.pdf',
      }),
    );
  });

  it('uploads a server-generated buffer and audits with a null user', async () => {
    const result = await service.uploadGeneratedAsset(input);

    expect(result.url).toBe('https://sandbox.storage.local/certificate.pdf');
    expect(provider.uploadBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'application/pdf', resourceType: 'raw' }),
    );
    expect(repository.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        metadata: expect.objectContaining({ generated: true, organizationId: ORG_ID }) as object,
      }),
    );
  });

  it('deduplicates identical content by checksum without re-uploading', async () => {
    repository.findByChecksum.mockResolvedValue(
      createAssetRecord({ secureUrl: 'https://sandbox.storage.local/existing.pdf' }),
    );

    const result = await service.uploadGeneratedAsset(input);

    expect(result.url).toBe('https://sandbox.storage.local/existing.pdf');
    expect(provider.uploadBuffer).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects disallowed mime types', async () => {
    await expect(
      service.uploadGeneratedAsset({
        ...input,
        filename: 'malware.exe',
        mimeType: 'application/octet-stream',
      }),
    ).rejects.toBeInstanceOf(InvalidStorageFileException);
  });
});
