export type StorageProviderName = 'CLOUDINARY' | 'SANDBOX';

/** Provider-level resource type (Cloudinary vocabulary). */
export type StorageResourceType = 'image' | 'video' | 'raw';

export interface StorageProviderStatus {
  provider: StorageProviderName;
  configured: boolean;
  sandbox: boolean;
  /** Whether the provider supports browser direct (signed) uploads. */
  directUploads: boolean;
}

export interface CreateSignedUploadRequest {
  folder: string;
  publicId: string;
  resourceType: StorageResourceType;
  expiresAt: Date;
  tags?: string[];
}

/**
 * Parameters a browser needs to POST a file directly to the provider.
 * Never contains the API secret; only the derived signature.
 */
export interface SignedUploadParameters {
  provider: StorageProviderName;
  uploadUrl: string;
  fields: Record<string, string | number>;
  expiresAt: string;
}

export interface UploadBufferRequest {
  buffer: Buffer;
  folder: string;
  publicId: string;
  filename: string;
  mimeType: string;
  resourceType: StorageResourceType;
  tags?: string[];
}

export interface ProviderUploadResult {
  provider: StorageProviderName;
  providerAssetId: string | null;
  /** Fully-qualified public id (including folder). */
  publicId: string;
  secureUrl: string;
  resourceType: StorageResourceType;
  bytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  format?: string;
  etag?: string;
  version: number;
}

export interface VerifyUploadRequest {
  publicId: string;
  resourceType: StorageResourceType;
  expectedBytes: number;
}

export interface DownloadBufferRequest {
  secureUrl?: string;
  publicId?: string;
  resourceType?: StorageResourceType;
}

export interface DownloadBufferResult {
  buffer: Buffer;
  mimeType: string;
  bytes: number;
}

export interface StorageProvider {
  readonly name: StorageProviderName;
  isConfigured(): boolean;
  getStatus(): StorageProviderStatus;
  /** Creates parameters for a signed browser direct upload. */
  createSignedUpload(request: CreateSignedUploadRequest): SignedUploadParameters;
  /** Server-side upload for small or server-generated files. */
  uploadBuffer(request: UploadBufferRequest): Promise<ProviderUploadResult>;
  /** Fetches and verifies an asset after a direct upload before persisting it. */
  verifyUploadedAsset(request: VerifyUploadRequest): Promise<ProviderUploadResult>;
  downloadBuffer(request: DownloadBufferRequest): Promise<DownloadBufferResult>;
  delete(publicId: string, resourceType: StorageResourceType): Promise<void>;
}
