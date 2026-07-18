'use client';

import { FileUpload } from '@graphology/ui';
import { useState } from 'react';
import { StorageApi } from '../../lib/api';
import { MediaImage } from './media-image';

export function AvatarUpload({
  organizationId,
  userId,
  initialUrl,
  alt,
}: {
  organizationId: string;
  userId: string;
  initialUrl?: string | null;
  alt: string;
}): React.JSX.Element {
  const [url, setUrl] = useState(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {url ? (
        <MediaImage src={url} alt={alt} className="mx-auto h-20 w-20 rounded-full" sizes="80px" />
      ) : null}
      <FileUpload
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={uploading || !organizationId}
        label={uploading ? 'Uploading avatar…' : 'Upload avatar'}
        helperText="PNG, JPG, WebP or GIF"
        onFilesChange={(files) => {
          const file = files?.[0];
          if (!file) {
            return;
          }
          setUploading(true);
          setError(null);
          void StorageApi.upload(file, {
            organizationId,
            entityType: 'USER_AVATAR',
            entityId: userId,
          })
            .then((asset) => StorageApi.setCurrentUserAvatar(organizationId, asset.id))
            .then((result) => {
              setUrl(result.profileImage);
            })
            .catch(() => {
              setError('Unable to upload your avatar.');
            })
            .finally(() => {
              setUploading(false);
            });
        }}
      />
      {error ? (
        <p className="text-caption text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
