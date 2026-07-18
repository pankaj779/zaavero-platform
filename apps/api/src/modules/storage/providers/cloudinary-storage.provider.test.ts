import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnvConfig } from '../../../config/env.schema';
import {
  InvalidStorageUploadException,
  StorageProviderException,
  StorageProviderNotConfiguredException,
} from '../exceptions';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

const { configMock, signMock, uploadStreamMock, destroyMock, resourceMock } = vi.hoisted(() => ({
  configMock: vi.fn(),
  signMock: vi.fn(),
  uploadStreamMock: vi.fn(),
  destroyMock: vi.fn(),
  resourceMock: vi.fn(),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: configMock,
    utils: { api_sign_request: signMock },
    uploader: { upload_stream: uploadStreamMock, destroy: destroyMock },
    api: { resource: resourceMock },
  },
}));

function createProvider(overrides: Partial<EnvConfig> = {}): CloudinaryStorageProvider {
  return new CloudinaryStorageProvider(
    new ConfigService<EnvConfig, true>({
      CLOUDINARY_CLOUD_NAME: 'demo-cloud',
      CLOUDINARY_API_KEY: 'key_123',
      CLOUDINARY_API_SECRET: 'secret_456',
      ...overrides,
    }),
  );
}

const uploadResponse = {
  asset_id: 'asset-1',
  public_id: 'graphology/org-1/user_avatar/abc',
  secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/abc.png',
  resource_type: 'image',
  format: 'png',
  bytes: 2048,
  width: 128,
  height: 128,
  etag: 'etag-1',
  version: 42,
};

beforeEach(() => {
  configMock.mockReset();
  signMock.mockReset();
  uploadStreamMock.mockReset();
  destroyMock.mockReset();
  resourceMock.mockReset();
});

describe('CloudinaryStorageProvider', () => {
  it('reports configuration status', () => {
    expect(createProvider().isConfigured()).toBe(true);
    expect(createProvider().getStatus()).toEqual({
      provider: 'CLOUDINARY',
      configured: true,
      sandbox: false,
      directUploads: true,
    });
    expect(createProvider({ CLOUDINARY_API_SECRET: undefined }).isConfigured()).toBe(false);
  });

  it('fails fast when not configured', () => {
    const provider = createProvider({ CLOUDINARY_API_SECRET: undefined });
    expect(() =>
      provider.createSignedUpload({
        folder: 'f',
        publicId: 'p',
        resourceType: 'image',
        expiresAt: new Date(),
      }),
    ).toThrow(StorageProviderNotConfiguredException);
  });

  it('creates signed upload parameters without exposing the API secret', () => {
    signMock.mockReturnValue('signed-value');
    const provider = createProvider();

    const result = provider.createSignedUpload({
      folder: 'graphology/org-1/user_avatar',
      publicId: 'abc',
      resourceType: 'image',
      expiresAt: new Date('2026-01-01T00:00:00Z'),
      tags: ['avatar'],
    });

    expect(signMock).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'graphology/org-1/user_avatar',
        public_id: 'abc',
        tags: 'avatar',
      }),
      'secret_456',
    );
    expect(result.uploadUrl).toBe('https://api.cloudinary.com/v1_1/demo-cloud/image/upload');
    expect(result.fields.signature).toBe('signed-value');
    expect(result.fields.api_key).toBe('key_123');
    expect(JSON.stringify(result)).not.toContain('secret_456');
  });

  it('uploads a buffer via upload_stream and maps the response', async () => {
    uploadStreamMock.mockImplementation(
      (_options: unknown, callback: (error?: Error, result?: typeof uploadResponse) => void) => ({
        end: (): void => {
          callback(undefined, uploadResponse);
        },
      }),
    );
    const provider = createProvider();

    const result = await provider.uploadBuffer({
      buffer: Buffer.from('image-bytes'),
      folder: 'graphology/org-1/user_avatar',
      publicId: 'abc',
      filename: 'avatar.png',
      mimeType: 'image/png',
      resourceType: 'image',
    });

    expect(uploadStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_type: 'image',
        folder: 'graphology/org-1/user_avatar',
        public_id: 'abc',
        overwrite: false,
      }),
      expect.any(Function),
    );
    expect(result).toEqual({
      provider: 'CLOUDINARY',
      providerAssetId: 'asset-1',
      publicId: 'graphology/org-1/user_avatar/abc',
      secureUrl: uploadResponse.secure_url,
      resourceType: 'image',
      bytes: 2048,
      width: 128,
      height: 128,
      durationSeconds: undefined,
      format: 'png',
      etag: 'etag-1',
      version: 42,
    });
  });

  it('wraps upload failures without leaking provider payloads', async () => {
    uploadStreamMock.mockImplementation(
      (_options: unknown, callback: (error?: Error, result?: typeof uploadResponse) => void) => ({
        end: (): void => {
          callback(new Error('boom'), undefined);
        },
      }),
    );
    const provider = createProvider();

    await expect(
      provider.uploadBuffer({
        buffer: Buffer.from('x'),
        folder: 'f',
        publicId: 'p',
        filename: 'a.png',
        mimeType: 'image/png',
        resourceType: 'image',
      }),
    ).rejects.toBeInstanceOf(StorageProviderException);
  });

  it('verifies a finalized upload against the provider record', async () => {
    resourceMock.mockResolvedValue(uploadResponse);
    const provider = createProvider();

    const result = await provider.verifyUploadedAsset({
      publicId: 'graphology/org-1/user_avatar/abc',
      resourceType: 'image',
      expectedBytes: 2048,
    });
    expect(result.publicId).toBe('graphology/org-1/user_avatar/abc');

    await expect(
      provider.verifyUploadedAsset({
        publicId: 'graphology/org-1/user_avatar/abc',
        resourceType: 'image',
        expectedBytes: 1,
      }),
    ).rejects.toBeInstanceOf(InvalidStorageUploadException);
  });

  it('rejects verification when the asset is missing at the provider', async () => {
    resourceMock.mockRejectedValue(new Error('not found'));
    const provider = createProvider();

    await expect(
      provider.verifyUploadedAsset({ publicId: 'missing', resourceType: 'raw', expectedBytes: 1 }),
    ).rejects.toBeInstanceOf(InvalidStorageUploadException);
  });

  it('deletes assets and tolerates not-found results', async () => {
    destroyMock.mockResolvedValue({ result: 'ok' });
    const provider = createProvider();
    await provider.delete('graphology/org-1/user_avatar/abc', 'image');
    expect(destroyMock).toHaveBeenCalledWith('graphology/org-1/user_avatar/abc', {
      resource_type: 'image',
      invalidate: true,
    });

    destroyMock.mockResolvedValue({ result: 'not found' });
    await expect(provider.delete('gone', 'image')).resolves.toBeUndefined();

    destroyMock.mockResolvedValue({ result: 'error' });
    await expect(provider.delete('bad', 'image')).rejects.toBeInstanceOf(StorageProviderException);
  });
});
