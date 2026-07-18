import { describe, expect, it } from 'vitest';
import { mapStorageAsset, type StorageAssetApiRecord } from './storage-mapper';

const record: StorageAssetApiRecord = {
  id: 'asset-1',
  organizationId: 'org-1',
  ownerUserId: 'user-1',
  entityType: 'COURSE_THUMBNAIL',
  entityId: 'course-1',
  provider: 'CLOUDINARY',
  resourceType: 'IMAGE',
  deliveryType: 'UPLOAD',
  publicId: 'org/course',
  url: 'https://cdn.example/course.webp',
  originalFilename: 'course.webp',
  mimeType: 'image/webp',
  extension: 'webp',
  sizeBytes: 1024,
  checksumSha256: 'a'.repeat(64),
  width: 1280,
  height: 800,
  durationSeconds: null,
  format: 'webp',
  version: 1,
  tags: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('mapStorageAsset', () => {
  it('maps provider metadata to the UI contract', () => {
    expect(mapStorageAsset(record)).toEqual({
      id: 'asset-1',
      organizationId: 'org-1',
      entityType: 'COURSE_THUMBNAIL',
      entityId: 'course-1',
      url: 'https://cdn.example/course.webp',
      filename: 'course.webp',
      mimeType: 'image/webp',
      sizeBytes: 1024,
      width: 1280,
      height: 800,
      durationSeconds: null,
      provider: 'CLOUDINARY',
    });
  });
});
