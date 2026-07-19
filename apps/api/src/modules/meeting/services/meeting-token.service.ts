import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import type { MeetingIntegrationRecord } from '../interfaces/meeting-repository.interface';
import {
  decryptPayload,
  decryptSecret,
  encryptPayload,
  encryptSecret,
  type EncryptedPayload,
} from '../utils/token-encryption';

@Injectable()
export class MeetingTokenService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  private key(): string | undefined {
    return this.config.get('TOKEN_ENCRYPTION_KEY', { infer: true });
  }

  encryptTokens(accessToken: string, refreshToken?: string | null): EncryptedPayload & {
    refreshTokenCipher: string | null;
  } {
    const access = encryptPayload(accessToken, this.key());
    const refreshTokenCipher = refreshToken
      ? encryptPayload(refreshToken, this.key()).ciphertext
      : null;
    // Refresh ciphertext reuses the same IV/tag envelope as access for storage simplicity:
    // we store refresh as an independent AEAD blob in compact form.
    return {
      ...access,
      refreshTokenCipher: refreshToken
        ? encryptSecret(refreshToken, this.key())
        : refreshTokenCipher,
    };
  }

  decryptAccessToken(integration: MeetingIntegrationRecord): string | null {
    if (!integration.accessTokenCipher || !integration.tokenIv || !integration.tokenAuthTag) {
      return null;
    }
    return decryptPayload(
      {
        ciphertext: integration.accessTokenCipher,
        iv: integration.tokenIv,
        authTag: integration.tokenAuthTag,
      },
      this.key(),
    );
  }

  decryptRefreshToken(integration: MeetingIntegrationRecord): string | null {
    if (!integration.refreshTokenCipher) return null;
    // Prefer compact secret format; fall back to payload fields if historically stored.
    if (integration.refreshTokenCipher.includes('.')) {
      return decryptSecret(integration.refreshTokenCipher, this.key());
    }
    if (!integration.tokenIv || !integration.tokenAuthTag) return null;
    return decryptPayload(
      {
        ciphertext: integration.refreshTokenCipher,
        iv: integration.tokenIv,
        authTag: integration.tokenAuthTag,
      },
      this.key(),
    );
  }

  encryptHostSecret(value: string): string {
    return encryptSecret(value, this.key());
  }

  decryptHostSecret(value: string | null | undefined): string | null {
    if (!value) return null;
    return decryptSecret(value, this.key());
  }
}
