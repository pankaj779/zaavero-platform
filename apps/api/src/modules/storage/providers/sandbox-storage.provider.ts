import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InvalidStorageUploadException } from '../exceptions';
import type {
  CreateSignedUploadRequest,
  ProviderUploadResult,
  SignedUploadParameters,
  StorageProvider,
  StorageProviderStatus,
  StorageResourceType,
  UploadBufferRequest,
  VerifyUploadRequest,
} from './storage-provider.interface';

/**
 * Local development/test provider. Assets are captured in process memory and
 * never leave the machine. Forbidden in production by env validation and the
 * provider factory.
 */
@Injectable()
export class SandboxStorageProvider implements StorageProvider {
  readonly name = 'SANDBOX' as const;

  private readonly logger = new Logger(SandboxStorageProvider.name);
  private readonly assets = new Map<string, ProviderUploadResult>();

  isConfigured(): boolean {
    return true;
  }

  getStatus(): StorageProviderStatus {
    return {
      provider: this.name,
      configured: true,
      sandbox: true,
      directUploads: true,
    };
  }

  createSignedUpload(request: CreateSignedUploadRequest): SignedUploadParameters {
    // Sandbox "direct uploads" point at the local API itself; nothing is
    // actually uploaded anywhere. Finalize will fail unless the asset was
    // registered through uploadBuffer, which keeps tests honest.
    return {
      provider: this.name,
      uploadUrl: 'sandbox://uploads',
      fields: {
        folder: request.folder,
        public_id: request.publicId,
        resource_type: request.resourceType,
      },
      expiresAt: request.expiresAt.toISOString(),
    };
  }

  uploadBuffer(request: UploadBufferRequest): Promise<ProviderUploadResult> {
    const publicId = `${request.folder}/${request.publicId}`;
    const result: ProviderUploadResult = {
      provider: this.name,
      providerAssetId: `sandbox-${createHash('sha1').update(publicId).digest('hex').slice(0, 12)}`,
      publicId,
      secureUrl: `https://sandbox.storage.local/${encodeURI(publicId)}`,
      resourceType: request.resourceType,
      bytes: request.buffer.length,
      etag: createHash('sha256').update(request.buffer).digest('hex'),
      format: request.filename.split('.').pop(),
      version: 1,
    };
    this.assets.set(publicId, result);
    this.logger.log(`Sandbox storage captured asset ${publicId} (${String(result.bytes)} bytes).`);
    return Promise.resolve(result);
  }

  verifyUploadedAsset(request: VerifyUploadRequest): Promise<ProviderUploadResult> {
    const asset = this.assets.get(request.publicId);
    if (asset?.bytes !== request.expectedBytes) {
      return Promise.reject(
        new InvalidStorageUploadException(
          'Sandbox assets must be uploaded through POST /storage/uploads first.',
        ),
      );
    }
    return Promise.resolve(asset);
  }

  delete(publicId: string, _resourceType: StorageResourceType): Promise<void> {
    this.assets.delete(publicId);
    return Promise.resolve();
  }
}
