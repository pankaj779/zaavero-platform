import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { media } from '../media/media';

export type DownloadKind = 'lesson' | 'pdf' | 'certificate' | 'invoice';

export interface DownloadEntry {
  id: string;
  kind: DownloadKind;
  title: string;
  localUri: string;
  sourcePath: string;
  sizeBytes?: number;
  downloadedAt: string;
}

const MANIFEST_KEY = 'graphology-downloads-manifest';

async function readManifest(): Promise<DownloadEntry[]> {
  const raw = await AsyncStorage.getItem(MANIFEST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DownloadEntry[];
  } catch {
    return [];
  }
}

async function writeManifest(entries: DownloadEntry[]): Promise<void> {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(entries));
}

/**
 * Download manager for offline access to lessons, PDFs, certificates and
 * invoices. Files are fetched with the existing bearer token and tracked in a
 * local manifest so they remain available without connectivity.
 */
export const downloads = {
  list: readManifest,

  async has(id: string): Promise<boolean> {
    const manifest = await readManifest();
    return manifest.some((entry) => entry.id === id);
  },

  async save(input: {
    id: string;
    kind: DownloadKind;
    title: string;
    sourcePath: string;
    fileName: string;
  }): Promise<DownloadEntry | null> {
    const localUri = await media.downloadAuthenticated(input.sourcePath, input.fileName);
    if (!localUri) return null;

    let sizeBytes: number | undefined;
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists && !info.isDirectory) sizeBytes = info.size;
    } catch {
      // size is best-effort
    }

    const entry: DownloadEntry = {
      id: input.id,
      kind: input.kind,
      title: input.title,
      localUri,
      sourcePath: input.sourcePath,
      sizeBytes,
      downloadedAt: new Date().toISOString(),
    };
    const manifest = (await readManifest()).filter((e) => e.id !== input.id);
    manifest.unshift(entry);
    await writeManifest(manifest);
    return entry;
  },

  async remove(id: string): Promise<void> {
    const manifest = await readManifest();
    const entry = manifest.find((e) => e.id === id);
    if (entry) {
      try {
        await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
      } catch {
        // file may already be gone
      }
    }
    await writeManifest(manifest.filter((e) => e.id !== id));
  },

  async clearAll(): Promise<void> {
    const manifest = await readManifest();
    await Promise.all(
      manifest.map((entry) =>
        FileSystem.deleteAsync(entry.localUri, { idempotent: true }).catch(() => undefined),
      ),
    );
    await writeManifest([]);
  },
};
