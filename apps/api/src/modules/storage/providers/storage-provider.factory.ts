import { Logger } from '@nestjs/common';
import type { EnvConfig } from '../../../config/env.schema';
import type { StorageProvider } from './storage-provider.interface';

const logger = new Logger('StorageProviderFactory');

/**
 * Selects the active storage provider. Sandbox is only ever selected outside
 * production (env validation additionally rejects sandbox settings in
 * production).
 */
export function resolveStorageProvider(
  config: Pick<EnvConfig, 'NODE_ENV' | 'STORAGE_PROVIDER' | 'STORAGE_SANDBOX_MODE'>,
  cloudinaryProvider: StorageProvider,
  sandboxProvider: StorageProvider,
): StorageProvider {
  const isProduction = config.NODE_ENV === 'production';
  const wantsSandbox = config.STORAGE_PROVIDER === 'SANDBOX' || config.STORAGE_SANDBOX_MODE;

  if (!isProduction && wantsSandbox) {
    logger.log('Storage sandbox mode active: assets are captured locally, not uploaded.');
    return sandboxProvider;
  }

  if (isProduction && wantsSandbox) {
    // Defense in depth; validateEnv already rejects this combination.
    logger.warn('Sandbox storage settings are ignored in production; using Cloudinary.');
  }

  return cloudinaryProvider;
}
