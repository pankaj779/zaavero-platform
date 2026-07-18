import { describe, expect, it } from 'vitest';
import { InvalidStorageUploadException } from '../exceptions';
import { SandboxStorageProvider } from './sandbox-storage.provider';

describe('SandboxStorageProvider', () => {
  it('is always configured and reports sandbox status', () => {
    const provider = new SandboxStorageProvider();
    expect(provider.isConfigured()).toBe(true);
    expect(provider.getStatus()).toEqual({
      provider: 'SANDBOX',
      configured: true,
      sandbox: true,
      directUploads: true,
    });
  });

  it('captures uploads in memory and verifies them afterwards', async () => {
    const provider = new SandboxStorageProvider();
    const uploaded = await provider.uploadBuffer({
      buffer: Buffer.from('hello world'),
      folder: 'graphology/org-1/user_avatar',
      publicId: 'abc',
      filename: 'avatar.png',
      mimeType: 'image/png',
      resourceType: 'image',
    });

    expect(uploaded.provider).toBe('SANDBOX');
    expect(uploaded.publicId).toBe('graphology/org-1/user_avatar/abc');
    expect(uploaded.bytes).toBe(11);
    expect(uploaded.secureUrl).toContain('https://sandbox.storage.local/');

    const verified = await provider.verifyUploadedAsset({
      publicId: uploaded.publicId,
      resourceType: 'image',
      expectedBytes: 11,
    });
    expect(verified).toEqual(uploaded);
  });

  it('rejects verification of unknown or mismatched assets', async () => {
    const provider = new SandboxStorageProvider();
    await expect(
      provider.verifyUploadedAsset({ publicId: 'missing', resourceType: 'raw', expectedBytes: 1 }),
    ).rejects.toBeInstanceOf(InvalidStorageUploadException);

    await provider.uploadBuffer({
      buffer: Buffer.from('data'),
      folder: 'f',
      publicId: 'x',
      filename: 'a.txt',
      mimeType: 'text/plain',
      resourceType: 'raw',
    });
    await expect(
      provider.verifyUploadedAsset({ publicId: 'f/x', resourceType: 'raw', expectedBytes: 999 }),
    ).rejects.toBeInstanceOf(InvalidStorageUploadException);
  });

  it('creates signed upload parameters without secrets and deletes assets', async () => {
    const provider = new SandboxStorageProvider();
    const signed = provider.createSignedUpload({
      folder: 'f',
      publicId: 'p',
      resourceType: 'image',
      expiresAt: new Date('2026-01-01T00:00:00Z'),
    });
    expect(signed.provider).toBe('SANDBOX');
    expect(JSON.stringify(signed)).not.toContain('secret');

    await provider.uploadBuffer({
      buffer: Buffer.from('data'),
      folder: 'f',
      publicId: 'p',
      filename: 'a.txt',
      mimeType: 'text/plain',
      resourceType: 'raw',
    });
    await provider.delete('f/p', 'raw');
    await expect(
      provider.verifyUploadedAsset({ publicId: 'f/p', resourceType: 'raw', expectedBytes: 4 }),
    ).rejects.toBeInstanceOf(InvalidStorageUploadException);
  });
});
