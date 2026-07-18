'use client';

import { useCallback, useState } from 'react';
import { StorageApi, type StorageAssetContext } from '../../lib/api/storage';
import type { StorageAsset } from '../../lib/api/storage-mapper';

export interface UseStorageUploadResult {
  upload: (file: File) => Promise<StorageAsset>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useStorageUpload(context: StorageAssetContext): UseStorageUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(10);
      setError(null);
      try {
        const asset = await StorageApi.upload(file, context);
        setProgress(100);
        return asset;
      } catch (cause) {
        setProgress(0);
        setError(cause instanceof Error ? cause.message : 'Unable to upload this file.');
        throw cause;
      } finally {
        setUploading(false);
      }
    },
    [context],
  );

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  return { upload, uploading, progress, error, reset };
}
