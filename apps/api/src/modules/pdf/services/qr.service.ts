import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import QRCode from 'qrcode';
import type { EnvConfig } from '../../../config/env.schema';

@Injectable()
export class QrService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  verificationUrl(verificationCode: string): string {
    const baseUrl =
      this.config.get('FRONTEND_URL', { infer: true }) ||
      this.config.get('APP_URL', { infer: true });
    return new URL(`/verify/${encodeURIComponent(verificationCode)}`, baseUrl).toString();
  }

  async certificateQrPng(verificationCode: string): Promise<Buffer> {
    return QRCode.toBuffer(this.verificationUrl(verificationCode), {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 512,
      color: { dark: '#142647', light: '#FFFFFF' },
    });
  }
}
