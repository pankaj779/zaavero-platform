import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import type { EnvConfig } from '../../../config/env.schema';
import {
  InvalidStorageUploadException,
  StorageProviderException,
  StorageProviderNotConfiguredException,
} from '../exceptions';
import type {
  CreateSignedUploadRequest,
  DownloadBufferRequest,
  DownloadBufferResult,
  ProviderUploadResult,
  SignedUploadParameters,
  StorageProvider,
  StorageProviderStatus,
  StorageResourceType,
  UploadBufferRequest,
  VerifyUploadRequest,
} from './storage-provider.interface';

interface CloudinaryResource {
  asset_id?: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  etag?: string;
  version?: number;
}

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = 'CLOUDINARY' as const;

  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private configured = false;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  isConfigured(): boolean {
    return this.credentials() !== null;
  }

  getStatus(): StorageProviderStatus {
    return {
      provider: this.name,
      configured: this.isConfigured(),
      sandbox: false,
      directUploads: true,
    };
  }

  createSignedUpload(request: CreateSignedUploadRequest): SignedUploadParameters {
    const credentials = this.ensureConfigured();
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, string | number> = {
      timestamp,
      folder: request.folder,
      public_id: request.publicId,
      ...(request.tags?.length ? { tags: request.tags.join(',') } : {}),
    };
    // The signature is derived from the secret; the secret itself never
    // leaves the server.
    const signature = cloudinary.utils.api_sign_request(params, credentials.apiSecret);

    return {
      provider: this.name,
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(credentials.cloudName)}/${request.resourceType}/upload`,
      fields: {
        ...params,
        signature,
        api_key: credentials.apiKey,
      },
      expiresAt: request.expiresAt.toISOString(),
    };
  }

  async uploadBuffer(request: UploadBufferRequest): Promise<ProviderUploadResult> {
    this.ensureConfigured();
    try {
      const response = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: request.resourceType,
            folder: request.folder,
            public_id: request.publicId,
            tags: request.tags,
            overwrite: false,
          },
          (error, result) => {
            if (error || !result) {
              reject(error instanceof Error ? error : new Error('Empty Cloudinary response.'));
            } else {
              resolve(result);
            }
          },
        );
        stream.end(request.buffer);
      });
      return this.mapResource(response);
    } catch (error: unknown) {
      this.logger.error(`Cloudinary upload failed (${this.safeErrorCode(error)}).`);
      throw new StorageProviderException('The storage provider rejected the upload.');
    }
  }

  async verifyUploadedAsset(request: VerifyUploadRequest): Promise<ProviderUploadResult> {
    this.ensureConfigured();
    let resource: CloudinaryResource;
    try {
      resource = (await cloudinary.api.resource(request.publicId, {
        resource_type: request.resourceType,
      })) as CloudinaryResource;
    } catch (error: unknown) {
      this.logger.warn(`Cloudinary asset verification failed (${this.safeErrorCode(error)}).`);
      throw new InvalidStorageUploadException(
        'The uploaded asset could not be found at the storage provider.',
      );
    }
    if (resource.public_id !== request.publicId || resource.bytes !== request.expectedBytes) {
      throw new InvalidStorageUploadException(
        'The uploaded asset does not match the declared file.',
      );
    }
    return this.mapResource(resource);
  }

  async delete(publicId: string, resourceType: StorageResourceType): Promise<void> {
    this.ensureConfigured();
    try {
      const result = (await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      })) as { result?: string };
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Unexpected destroy result: ${result.result ?? 'empty'}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Cloudinary delete failed (${this.safeErrorCode(error)}).`);
      throw new StorageProviderException('The storage provider could not delete the asset.');
    }
  }

  async downloadBuffer(request: DownloadBufferRequest): Promise<DownloadBufferResult> {
    this.ensureConfigured();
    const url = request.secureUrl?.trim();
    if (!url) {
      throw new StorageProviderException('A secure URL is required to download this asset.');
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new StorageProviderException('The storage provider could not download the asset.');
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';
    return { buffer, mimeType, bytes: buffer.length };
  }

  private credentials(): { cloudName: string; apiKey: string; apiSecret: string } | null {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = this.configService.get('CLOUDINARY_API_KEY', { infer: true });
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET', { infer: true });
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  }

  private ensureConfigured(): { cloudName: string; apiKey: string; apiSecret: string } {
    const credentials = this.credentials();
    if (!credentials) {
      throw new StorageProviderNotConfiguredException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }
    if (!this.configured) {
      cloudinary.config({
        cloud_name: credentials.cloudName,
        api_key: credentials.apiKey,
        api_secret: credentials.apiSecret,
        secure: true,
      });
      this.configured = true;
    }
    return credentials;
  }

  private mapResource(resource: CloudinaryResource): ProviderUploadResult {
    return {
      provider: this.name,
      providerAssetId: resource.asset_id ?? null,
      publicId: resource.public_id,
      secureUrl: resource.secure_url,
      resourceType: this.toResourceType(resource.resource_type),
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      durationSeconds: resource.duration === undefined ? undefined : Math.round(resource.duration),
      format: resource.format,
      etag: resource.etag,
      version: resource.version ?? 1,
    };
  }

  private toResourceType(value: string): StorageResourceType {
    return value === 'image' || value === 'video' ? value : 'raw';
  }

  /** Never logs raw provider payloads; they may echo request internals. */
  private safeErrorCode(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'http_code' in error) {
      const httpCode = (error as { http_code?: unknown }).http_code;
      if (typeof httpCode === 'number' || typeof httpCode === 'string') {
        return `http ${String(httpCode)}`;
      }
    }
    return error instanceof Error ? error.name : 'unknown';
  }
}
