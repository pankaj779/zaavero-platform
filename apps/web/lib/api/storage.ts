import { apiFetch } from '../auth/api-client';
import {
  mapStorageAsset,
  type StorageAsset,
  type StorageAssetApiRecord,
  type StorageEntityType,
  type StorageProviderName,
} from './storage-mapper';

export interface StorageAssetContext {
  organizationId: string;
  entityType: StorageEntityType;
  entityId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SignStorageUploadInput extends StorageAssetContext {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SignedStorageUpload {
  upload: {
    provider: StorageProviderName;
    uploadUrl: string;
    fields: Record<string, string | number>;
    expiresAt: string;
  };
  publicId: string;
  folder: string;
}

export interface StorageProviderStatus {
  provider: StorageProviderName;
  configured: boolean;
  sandbox: boolean;
  directUploads: boolean;
}

export interface ListStorageAssetsParams {
  organizationId: string;
  entityType?: StorageEntityType;
  entityId?: string;
  page?: number;
  limit?: number;
}

export interface StorageAssetList {
  items: StorageAsset[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function appendContext(form: FormData, context: StorageAssetContext): void {
  form.append('organizationId', context.organizationId);
  form.append('entityType', context.entityType);
  if (context.entityId) {
    form.append('entityId', context.entityId);
  }
  for (const tag of context.tags ?? []) {
    form.append('tags[]', tag);
  }
  if (context.metadata) {
    form.append('metadata', JSON.stringify(context.metadata));
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

async function checksumSha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function directUpload(file: File, signed: SignedStorageUpload): Promise<void> {
  const body = new FormData();
  for (const [key, value] of Object.entries(signed.upload.fields)) {
    body.append(key, String(value));
  }
  body.append('file', file);

  const response = await fetch(signed.upload.uploadUrl, { method: 'POST', body });
  if (!response.ok) {
    throw new Error(`Storage provider upload failed with status ${String(response.status)}.`);
  }
}

export const StorageApi = {
  async signUpload(input: SignStorageUploadInput): Promise<SignedStorageUpload> {
    return apiFetch<SignedStorageUpload>('/storage/uploads/sign', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async finalizeUpload(
    input: SignStorageUploadInput & { publicId: string; checksumSha256: string },
  ): Promise<StorageAsset> {
    return mapStorageAsset(
      await apiFetch<StorageAssetApiRecord>('/storage/uploads/finalize', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },

  async uploadMultipart(file: File, context: StorageAssetContext): Promise<StorageAsset> {
    const body = new FormData();
    appendContext(body, context);
    body.append('file', file);
    return mapStorageAsset(
      await apiFetch<StorageAssetApiRecord>('/storage/uploads', { method: 'POST', body }),
    );
  },

  async upload(file: File, context: StorageAssetContext): Promise<StorageAsset> {
    const input: SignStorageUploadInput = {
      ...context,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    };
    const signed = await this.signUpload(input);

    // The sandbox provider intentionally has no browser endpoint. Multipart
    // registers the in-memory asset and is the supported local-dev path.
    if (signed.upload.provider === 'SANDBOX' || signed.upload.uploadUrl.startsWith('sandbox:')) {
      return this.uploadMultipart(file, context);
    }

    await directUpload(file, signed);
    return this.finalizeUpload({
      ...input,
      publicId: signed.publicId,
      checksumSha256: await checksumSha256(file),
    });
  },

  async getAsset(id: string, organizationId: string): Promise<StorageAsset> {
    const record = await apiFetch<StorageAssetApiRecord>(
      `/storage/assets/${id}?${query({ organizationId })}`,
    );
    return mapStorageAsset(record);
  },

  async listAssets(params: ListStorageAssetsParams): Promise<StorageAssetList> {
    const payload = await apiFetch<{
      items: StorageAssetApiRecord[];
      meta: StorageAssetList['meta'];
    }>(
      `/storage/assets?${query({
        organizationId: params.organizationId,
        entityType: params.entityType,
        entityId: params.entityId,
        page: params.page,
        limit: params.limit,
      })}`,
    );
    return { items: payload.items.map(mapStorageAsset), meta: payload.meta };
  },

  async replaceAsset(id: string, organizationId: string, file: File): Promise<StorageAsset> {
    const body = new FormData();
    body.append('organizationId', organizationId);
    body.append('file', file);
    return mapStorageAsset(
      await apiFetch<StorageAssetApiRecord>(`/storage/assets/${id}/replace`, {
        method: 'POST',
        body,
      }),
    );
  },

  async deleteAsset(id: string, organizationId: string): Promise<boolean> {
    const result = await apiFetch<{ deleted: boolean }>(
      `/storage/assets/${id}?${query({ organizationId })}`,
      { method: 'DELETE' },
    );
    return result.deleted;
  },

  getProviderStatus(): Promise<StorageProviderStatus> {
    return apiFetch<StorageProviderStatus>('/storage/provider/status');
  },

  async setCurrentUserAvatar(
    organizationId: string,
    assetId: string | null,
  ): Promise<{ profileImage: string | null }> {
    return apiFetch<{ profileImage: string | null }>('/auth/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ organizationId, profileImage: assetId }),
    });
  },
};
