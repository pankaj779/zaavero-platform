import { apiFetch } from '../api/client';
import type { PickedAsset } from './media';

export interface UploadedAsset {
  id: string;
  url?: string | null;
  secureUrl?: string | null;
  publicId?: string | null;
}

/**
 * Uploads a camera/library asset through the existing NestJS multipart storage
 * endpoint (`POST /storage/uploads`). The backend (Cloudinary or sandbox)
 * owns the provider logic — the mobile app never talks to Cloudinary directly.
 */
export async function uploadAsset(
  asset: PickedAsset,
  context: {
    organizationId: string;
    entityType: string;
    entityId: string;
    purpose?: string;
  },
): Promise<UploadedAsset> {
  const form = new FormData();
  form.append('organizationId', context.organizationId);
  form.append('entityType', context.entityType);
  form.append('entityId', context.entityId);
  if (context.purpose) form.append('purpose', context.purpose);
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName,
    type: asset.mimeType,
  } as unknown as Blob);

  return apiFetch<UploadedAsset>('/storage/uploads', {
    method: 'POST',
    body: form,
  });
}

export async function setAvatar(
  organizationId: string,
  assetId: string | null,
): Promise<{ profileImage: string | null }> {
  return apiFetch<{ profileImage: string | null }>('/auth/me/avatar', {
    method: 'PATCH',
    body: { organizationId, profileImage: assetId },
  });
}
