import { describe, expect, it } from 'vitest';
import { QrService } from '../services/qr.service';
import { createConfig } from './pdf-test.helpers';

describe('QrService', () => {
  it('builds the public verification URL from FRONTEND_URL', () => {
    const service = new QrService(createConfig());

    expect(service.verificationUrl('VER-abc123')).toBe(
      'https://app.graphology.test/verify/VER-abc123',
    );
  });

  it('URL-encodes unsafe characters in the verification code', () => {
    const service = new QrService(createConfig());

    expect(service.verificationUrl('VER a/b')).toBe(
      'https://app.graphology.test/verify/VER%20a%2Fb',
    );
  });

  it('renders a PNG buffer for the QR code', async () => {
    const service = new QrService(createConfig());

    const png = await service.certificateQrPng('VER-abc123');

    expect(png.length).toBeGreaterThan(100);
    // PNG magic number.
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });
});
