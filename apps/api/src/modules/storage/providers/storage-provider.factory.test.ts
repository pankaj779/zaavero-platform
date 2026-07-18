import { describe, expect, it } from 'vitest';
import { resolveStorageProvider } from './storage-provider.factory';
import type { StorageProvider } from './storage-provider.interface';

const cloudinaryProvider = { name: 'CLOUDINARY' } as unknown as StorageProvider;
const sandboxProvider = { name: 'SANDBOX' } as unknown as StorageProvider;

describe('resolveStorageProvider', () => {
  it('selects the sandbox provider outside production when sandbox mode is on', () => {
    expect(
      resolveStorageProvider(
        { NODE_ENV: 'development', STORAGE_PROVIDER: 'CLOUDINARY', STORAGE_SANDBOX_MODE: true },
        cloudinaryProvider,
        sandboxProvider,
      ),
    ).toBe(sandboxProvider);
    expect(
      resolveStorageProvider(
        { NODE_ENV: 'test', STORAGE_PROVIDER: 'SANDBOX', STORAGE_SANDBOX_MODE: false },
        cloudinaryProvider,
        sandboxProvider,
      ),
    ).toBe(sandboxProvider);
  });

  it('selects Cloudinary when sandbox mode is off', () => {
    expect(
      resolveStorageProvider(
        { NODE_ENV: 'development', STORAGE_PROVIDER: 'CLOUDINARY', STORAGE_SANDBOX_MODE: false },
        cloudinaryProvider,
        sandboxProvider,
      ),
    ).toBe(cloudinaryProvider);
  });

  it('never selects the sandbox provider in production', () => {
    expect(
      resolveStorageProvider(
        { NODE_ENV: 'production', STORAGE_PROVIDER: 'CLOUDINARY', STORAGE_SANDBOX_MODE: false },
        cloudinaryProvider,
        sandboxProvider,
      ),
    ).toBe(cloudinaryProvider);
    // Defense in depth: even if validation were bypassed, production stays real.
    expect(
      resolveStorageProvider(
        { NODE_ENV: 'production', STORAGE_PROVIDER: 'SANDBOX', STORAGE_SANDBOX_MODE: true },
        cloudinaryProvider,
        sandboxProvider,
      ),
    ).toBe(cloudinaryProvider);
  });
});
