import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock('../auth/api-client', () => ({ apiFetch: apiFetchMock }));

import { StorageApi } from './storage';

describe('StorageApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('uses multipart when the signed provider is sandbox', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        upload: {
          provider: 'SANDBOX',
          uploadUrl: 'sandbox://uploads',
          fields: {},
          expiresAt: '2026-07-01T00:05:00.000Z',
        },
        publicId: 'avatar',
        folder: 'org',
      })
      .mockResolvedValueOnce({
        id: 'asset-1',
        organizationId: 'org-1',
        ownerUserId: 'user-1',
        entityType: 'USER_AVATAR',
        entityId: 'user-1',
        provider: 'SANDBOX',
        resourceType: 'IMAGE',
        deliveryType: 'UPLOAD',
        publicId: 'org/avatar',
        url: 'https://sandbox.storage.local/org/avatar',
        originalFilename: 'avatar.png',
        mimeType: 'image/png',
        extension: 'png',
        sizeBytes: 3,
        checksumSha256: 'a'.repeat(64),
        width: null,
        height: null,
        durationSeconds: null,
        format: 'png',
        version: 1,
        tags: [],
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      });

    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    await StorageApi.upload(file, {
      organizationId: 'org-1',
      entityType: 'USER_AVATAR',
      entityId: 'user-1',
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/storage/uploads/sign', expect.any(Object));
    const multipartCall = apiFetchMock.mock.calls[1];
    expect(multipartCall?.[0]).toBe('/storage/uploads');
    const multipartInit = multipartCall?.[1] as RequestInit | undefined;
    expect(multipartInit?.body).toBeInstanceOf(FormData);
  });

  it('builds entity-filtered asset list queries', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    await StorageApi.listAssets({
      organizationId: 'org-1',
      entityType: 'LESSON_PDF',
      entityId: 'lesson-1',
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/storage/assets?organizationId=org-1&entityType=LESSON_PDF&entityId=lesson-1',
    );
  });
});
