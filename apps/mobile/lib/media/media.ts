import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { env } from '../config/env';
import { tokenStorage } from '../auth/token-storage';
import { authService } from '../auth/auth-service';

export interface PickedAsset {
  uri: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

function toPicked(result: ImagePicker.ImagePickerResult): PickedAsset | null {
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `upload-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    width: asset.width,
    height: asset.height,
  };
}

export const media = {
  async capturePhoto(): Promise<PickedAsset | null> {
    if (!(await ensureCameraPermission())) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    return toPicked(result);
  },

  async pickImage(): Promise<PickedAsset | null> {
    if (!(await ensureLibraryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    return toPicked(result);
  },

  async pickDocument(): Promise<PickedAsset | null> {
    if (!(await ensureLibraryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'livePhotos'],
      quality: 0.9,
    });
    return toPicked(result);
  },

  /**
   * Downloads an authenticated file (certificate PDF, invoice, lesson asset) to
   * the device cache and returns the local URI. Reuses the existing bearer token.
   */
  async downloadAuthenticated(path: string, fileName: string): Promise<string | null> {
    let token = tokenStorage.getAccessToken();
    if (!token) {
      const refreshed = await authService.refresh();
      if (refreshed) token = tokenStorage.getAccessToken();
    }
    const url = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;
    const target = `${FileSystem.cacheDirectory ?? ''}${fileName}`;
    const result = await FileSystem.downloadAsync(url, target, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return result.status === 200 ? result.uri : null;
  },

  async share(localUri: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri);
    }
  },

  cacheInfo(fileName: string): string {
    return `${FileSystem.cacheDirectory ?? ''}${fileName}`;
  },
};
