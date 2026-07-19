import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  GOOGLE_MEET_OAUTH_SCOPES,
  MEETING_AUDIT_ACTIONS,
  MEETING_AUDIT_ENTITY,
  OAUTH_STATE_TTL_MS,
  ZOOM_OAUTH_SCOPES,
  type MeetingProviderValue,
  type ProvisionableMeetingProvider,
} from '../constants/meeting.constants';
import { MEETING_PROVIDER_REGISTRY, MEETING_REPOSITORY } from '../constants/injection-tokens';
import type { MeetingOAuthStartResponseDto } from '../dto/meeting-integration-response.dto';
import type { StartMeetingOAuthDto } from '../dto/start-meeting-oauth.dto';
import {
  MeetingOAuthStateInvalidException,
  MeetingSandboxForbiddenException,
  OrganizationAccessDeniedException,
} from '../exceptions';
import type { MeetingRepository } from '../interfaces/meeting-repository.interface';
import { MeetingIntegrationMapper } from '../mappers/meeting-integration.mapper';
import type { MeetingProviderRegistry } from '../providers/meeting-provider.registry';
import { decryptSecret, encryptSecret, hashValue } from '../utils/token-encryption';
import { MeetingTokenService } from './meeting-token.service';

@Injectable()
export class MeetingOAuthService {
  constructor(
    @Inject(MEETING_REPOSITORY) private readonly repo: MeetingRepository,
    @Inject(MEETING_PROVIDER_REGISTRY) private readonly registry: MeetingProviderRegistry,
    private readonly tokens: MeetingTokenService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async start(
    user: AuthenticatedUser,
    dto: StartMeetingOAuthDto,
  ): Promise<{ message: string; data: MeetingOAuthStartResponseDto }> {
    this.assertOrgAccess(user, dto.organizationId);
    this.assertProviderAllowed(dto.provider);

    const integration = await this.repo.upsertIntegration({
      organizationId: dto.organizationId,
      provider: dto.provider,
      status: 'CONNECTING',
      connectedById: user.id,
      lastError: null,
    });

    const state = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const encryptionKey = this.config.get('TOKEN_ENCRYPTION_KEY', { infer: true });

    await this.repo.createOAuthState({
      organizationId: dto.organizationId,
      integrationId: integration.id,
      userId: user.id,
      provider: dto.provider,
      stateHash: hashValue(state),
      codeVerifierCipher: encryptSecret(codeVerifier, encryptionKey),
      redirectPath: dto.redirectPath ?? null,
      expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
    });

    const provider = this.registry.get(dto.provider);
    const redirectUri = this.oauthRedirectUri(dto.provider);
    const authorizeUrl = provider.buildAuthorizeUrl({
      organizationId: dto.organizationId,
      redirectUri,
      state,
      codeChallenge,
      scopes:
        dto.provider === 'ZOOM'
          ? [...ZOOM_OAUTH_SCOPES]
          : dto.provider === 'GOOGLE_MEET'
            ? [...GOOGLE_MEET_OAUTH_SCOPES]
            : ['sandbox'],
    });

    return {
      message: 'Meeting OAuth authorization started.',
      data: {
        authorizeUrl,
        integrationId: integration.id,
        provider: dto.provider,
      },
    };
  }

  async handleCallback(input: {
    provider: ProvisionableMeetingProvider;
    code?: string;
    state?: string;
    error?: string;
  }): Promise<{ redirectPath: string; organizationId: string }> {
    if (input.error || !input.code || !input.state) {
      throw new MeetingOAuthStateInvalidException(
        input.error ? `OAuth error: ${input.error}` : 'OAuth callback is missing code/state.',
      );
    }

    const oauthState = await this.repo.consumeOAuthState(hashValue(input.state));
    if (!oauthState) {
      throw new MeetingOAuthStateInvalidException();
    }
    if (oauthState.provider !== input.provider) {
      throw new MeetingOAuthStateInvalidException();
    }

    const encryptionKey = this.config.get('TOKEN_ENCRYPTION_KEY', { infer: true });
    const codeVerifier = decryptSecret(oauthState.codeVerifierCipher, encryptionKey);
    const provider = this.registry.get(input.provider);
    const redirectUri = this.oauthRedirectUri(input.provider);
    const client = this.clientCredentials(input.provider);

    const tokenSet = await provider.exchangeCode({
      code: input.code,
      redirectUri,
      codeVerifier,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
    });

    const encrypted = this.tokens.encryptTokens(tokenSet.accessToken, tokenSet.refreshToken);
    const integration = await this.repo.upsertIntegration({
      organizationId: oauthState.organizationId,
      provider: input.provider,
      status: 'CONNECTED',
      accessTokenCipher: encrypted.ciphertext,
      refreshTokenCipher: encrypted.refreshTokenCipher,
      tokenIv: encrypted.iv,
      tokenAuthTag: encrypted.authTag,
      tokenExpiresAt: tokenSet.expiresAt ?? null,
      scopes: tokenSet.scopes ?? [],
      externalAccountId: tokenSet.externalAccountId ?? null,
      externalAccountEmail: tokenSet.externalAccountEmail ?? null,
      connectedAt: new Date(),
      revokedAt: null,
      connectedById: oauthState.userId,
      lastError: null,
    });

    await this.repo.audit({
      organizationId: oauthState.organizationId,
      actorUserId: oauthState.userId,
      action: MEETING_AUDIT_ACTIONS.integrationConnected,
      entityType: MEETING_AUDIT_ENTITY,
      entityId: integration.id,
      metadata: { provider: input.provider },
    });

    return {
      redirectPath: oauthState.redirectPath ?? '/admin/settings/integrations',
      organizationId: oauthState.organizationId,
    };
  }

  async disconnect(user: AuthenticatedUser, organizationId: string, provider: MeetingProviderValue) {
    this.assertOrgAccess(user, organizationId);
    const existing = await this.repo.findIntegrationByOrgProvider(organizationId, provider);
    if (!existing) {
      return {
        message: 'Meeting integration already disconnected.',
        data: null,
      };
    }
    const updated = await this.repo.updateIntegration(existing.id, {
      status: 'REVOKED',
      accessTokenCipher: null,
      refreshTokenCipher: null,
      tokenIv: null,
      tokenAuthTag: null,
      tokenExpiresAt: null,
      revokedAt: new Date(),
      lastError: null,
    });
    await this.repo.audit({
      organizationId,
      actorUserId: user.id,
      action: MEETING_AUDIT_ACTIONS.integrationDisconnected,
      entityType: MEETING_AUDIT_ENTITY,
      entityId: updated.id,
      metadata: { provider },
    });
    return {
      message: 'Meeting integration disconnected.',
      data: MeetingIntegrationMapper.toResponse(updated),
    };
  }

  private oauthRedirectUri(provider: MeetingProviderValue): string {
    const apiUrl = this.config.get('API_URL', { infer: true });
    const slug =
      provider === 'GOOGLE_MEET' ? 'google' : provider === 'ZOOM' ? 'zoom' : 'sandbox';
    return `${apiUrl}/meetings/oauth/${slug}/callback`;
  }

  private clientCredentials(provider: MeetingProviderValue): {
    clientId: string | null;
    clientSecret: string | null;
  } {
    if (provider === 'ZOOM') {
      return {
        clientId: this.config.get('ZOOM_CLIENT_ID', { infer: true }) ?? null,
        clientSecret: this.config.get('ZOOM_CLIENT_SECRET', { infer: true }) ?? null,
      };
    }
    if (provider === 'GOOGLE_MEET') {
      return {
        clientId:
          this.config.get('GOOGLE_MEET_CLIENT_ID', { infer: true }) ??
          this.config.get('GOOGLE_CLIENT_ID', { infer: true }) ??
          null,
        clientSecret:
          this.config.get('GOOGLE_MEET_CLIENT_SECRET', { infer: true }) ??
          this.config.get('GOOGLE_CLIENT_SECRET', { infer: true }) ??
          null,
      };
    }
    return { clientId: 'sandbox', clientSecret: 'sandbox' };
  }

  private assertOrgAccess(user: AuthenticatedUser, organizationId: string) {
    if (!user.organizationIds.includes(organizationId)) {
      throw new OrganizationAccessDeniedException();
    }
  }

  private assertProviderAllowed(provider: MeetingProviderValue) {
    const nodeEnv = this.config.get('NODE_ENV', { infer: true });
    if (provider === 'SANDBOX' && nodeEnv === 'production') {
      throw new MeetingSandboxForbiddenException();
    }
  }
}
