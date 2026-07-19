import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  InvalidMeetingRequestException,
  InvalidMeetingWebhookException,
  MeetingProviderNotConfiguredException,
  MeetingProviderRejectedException,
} from '../exceptions';
import { hashValue } from '../utils/token-encryption';
import type {
  CreateProviderMeetingInput,
  MeetingOAuthAuthorizeInput,
  MeetingOAuthExchangeInput,
  MeetingOAuthTokens,
  MeetingProvider,
  MeetingProviderCredentials,
  MeetingWebhookVerificationInput,
  NormalizedMeetingWebhookEvent,
  ProviderMeetingResult,
  UpdateProviderMeetingInput,
} from './meeting-provider.interface';

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

@Injectable()
export class ZoomMeetingProvider implements MeetingProvider {
  readonly name = 'ZOOM' as const;

  isConfigured(credentials?: MeetingProviderCredentials | null): boolean {
    if (!credentials) return false;
    return Boolean(credentials.clientId && credentials.clientSecret);
  }

  buildAuthorizeUrl(input: MeetingOAuthAuthorizeInput): string {
    const url = new URL(ZOOM_AUTH_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', process.env.ZOOM_CLIENT_ID ?? '');
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('state', input.state);
    if (input.codeChallenge) {
      url.searchParams.set('code_challenge', input.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    return url.toString();
  }

  async exchangeCode(input: MeetingOAuthExchangeInput): Promise<MeetingOAuthTokens> {
    const clientId = input.clientId ?? process.env.ZOOM_CLIENT_ID;
    const clientSecret = input.clientSecret ?? process.env.ZOOM_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new MeetingProviderNotConfiguredException('Zoom OAuth credentials are not configured.');
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
    });
    if (input.codeVerifier) {
      body.set('code_verifier', input.codeVerifier);
    }
    const token = await this.requestToken(clientId, clientSecret, body);
    return token;
  }

  async refreshTokens(credentials: MeetingProviderCredentials): Promise<MeetingOAuthTokens> {
    if (!credentials.refreshToken || !credentials.clientId || !credentials.clientSecret) {
      throw new MeetingProviderNotConfiguredException('Zoom refresh credentials are incomplete.');
    }
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
    });
    return this.requestToken(credentials.clientId, credentials.clientSecret, body);
  }

  async createMeeting(
    credentials: MeetingProviderCredentials,
    input: CreateProviderMeetingInput,
  ): Promise<ProviderMeetingResult> {
    const durationMinutes = input.endsAt
      ? Math.max(1, Math.round((input.endsAt.getTime() - input.startsAt.getTime()) / 60_000))
      : 60;
    const payload = {
      topic: input.title,
      type: input.recurrenceRule ? 8 : 2,
      start_time: input.startsAt.toISOString(),
      duration: durationMinutes,
      timezone: input.timezone,
      agenda: input.description ?? undefined,
      settings: {
        waiting_room: input.waitingRoom ?? true,
        mute_upon_entry: input.muteOnEntry ?? true,
        join_before_host: false,
        approval_type: 2,
      },
    };
    const data = await this.api<Record<string, unknown>>(
      credentials,
      'POST',
      '/users/me/meetings',
      payload,
    );
    return this.toResult(data);
  }

  async updateMeeting(
    credentials: MeetingProviderCredentials,
    input: UpdateProviderMeetingInput,
  ): Promise<ProviderMeetingResult> {
    const patch: Record<string, unknown> = {};
    if (input.title) patch.topic = input.title;
    if (input.description !== undefined) patch.agenda = input.description;
    if (input.startsAt) patch.start_time = input.startsAt.toISOString();
    if (input.timezone) patch.timezone = input.timezone;
    if (input.endsAt && input.startsAt) {
      patch.duration = Math.max(
        1,
        Math.round((input.endsAt.getTime() - input.startsAt.getTime()) / 60_000),
      );
    }
    if (input.waitingRoom !== undefined || input.muteOnEntry !== undefined) {
      patch.settings = {
        ...(input.waitingRoom !== undefined ? { waiting_room: input.waitingRoom } : {}),
        ...(input.muteOnEntry !== undefined ? { mute_upon_entry: input.muteOnEntry } : {}),
      };
    }
    await this.api(credentials, 'PATCH', `/meetings/${input.providerMeetingId}`, patch);
    const data = await this.api<Record<string, unknown>>(
      credentials,
      'GET',
      `/meetings/${input.providerMeetingId}`,
    );
    return this.toResult(data);
  }

  async deleteMeeting(
    credentials: MeetingProviderCredentials,
    providerMeetingId: string,
  ): Promise<void> {
    await this.api(credentials, 'DELETE', `/meetings/${providerMeetingId}`);
  }

  verifyAndParseWebhook(input: MeetingWebhookVerificationInput): NormalizedMeetingWebhookEvent {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(input.rawBody) as Record<string, unknown>;
    } catch {
      throw new InvalidMeetingWebhookException('Zoom webhook body must be JSON.');
    }

    const event = typeof payload.event === 'string' ? payload.event : 'unknown';
    if (event === 'endpoint.url_validation') {
      const plainToken =
        payload.payload &&
        typeof payload.payload === 'object' &&
        typeof (payload.payload as Record<string, unknown>).plainToken === 'string'
          ? String((payload.payload as Record<string, unknown>).plainToken)
          : null;
      if (!plainToken || !input.webhookSecret) {
        throw new InvalidMeetingWebhookException('Zoom CRC challenge is missing.');
      }
      const encryptedToken = createHmac('sha256', input.webhookSecret)
        .update(plainToken)
        .digest('hex');
      return {
        eventId: `zoom-crc-${hashValue(plainToken)}`,
        eventType: 'url_validation',
        rawType: event,
        payload,
        signatureHash: hashValue(input.rawBody),
        challengeResponse: { plainToken, encryptedToken },
      };
    }

    this.assertZoomSignature(input);

    const object = this.extractObject(payload);
    const eventTs =
      typeof payload.event_ts === 'number' ? String(payload.event_ts) : null;
    const eventId =
      (eventTs ? `zoom-${eventTs}-` : 'zoom-') +
      (typeof object.uuid === 'string'
        ? object.uuid
        : typeof object.id === 'string' || typeof object.id === 'number'
          ? String(object.id)
          : hashValue(input.rawBody).slice(0, 16)) +
      `-${event}`;

    const joinTime =
      typeof object.join_time === 'string' ? object.join_time : '';
    const recordingFileId = ((): string | null => {
      if (!Array.isArray(object.recording_files) || object.recording_files.length === 0) {
        return typeof object.uuid === 'string' ? object.uuid : null;
      }
      const files = object.recording_files as unknown[];
      const first = files[0];
      if (first && typeof first === 'object') {
        const id = (first as Record<string, unknown>).id;
        if (typeof id === 'string') return id;
      }
      return typeof object.uuid === 'string' ? object.uuid : null;
    })();

    return {
      eventId,
      eventType: this.mapType(event),
      rawType: event,
      occurredAt:
        typeof payload.event_ts === 'number' ? new Date(payload.event_ts) : new Date(),
      providerMeetingId:
        typeof object.id === 'string' || typeof object.id === 'number'
          ? String(object.id)
          : typeof object.uuid === 'string'
            ? object.uuid
            : null,
      providerParticipantId:
        typeof object.user_id === 'string'
          ? object.user_id
          : typeof object.participant_user_id === 'string'
            ? object.participant_user_id
            : null,
      providerJoinId:
        typeof object.user_id === 'string' && typeof object.id === 'string'
          ? `${object.id}:${object.user_id}:${joinTime}`
          : typeof object.id === 'string'
            ? object.id
            : null,
      providerRecordingId: recordingFileId,
      displayName:
        typeof object.user_name === 'string'
          ? object.user_name
          : typeof object.participant_user_name === 'string'
            ? object.participant_user_name
            : null,
      email: typeof object.email === 'string' ? object.email : null,
      joinUrl: typeof object.join_url === 'string' ? object.join_url : null,
      playUrl:
        typeof object.share_url === 'string'
          ? object.share_url
          : typeof object.play_url === 'string'
            ? object.play_url
            : null,
      downloadUrl: typeof object.download_url === 'string' ? object.download_url : null,
      durationSeconds: typeof object.duration === 'number' ? object.duration * 60 : null,
      payload,
      signatureHash: hashValue(input.rawBody),
    };
  }

  private assertZoomSignature(input: MeetingWebhookVerificationInput): void {
    const secret = input.webhookSecret;
    if (!secret) {
      throw new InvalidMeetingWebhookException('Zoom webhook secret is not configured.');
    }
    const signatureHeader = this.header(input.headers, 'x-zm-signature');
    const timestamp = this.header(input.headers, 'x-zm-request-timestamp');
    if (!signatureHeader || !timestamp) {
      throw new InvalidMeetingWebhookException('Zoom webhook signature headers are missing.');
    }
    const message = `v0:${timestamp}:${input.rawBody}`;
    const expected = `v0=${createHmac('sha256', secret).update(message).digest('hex')}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new InvalidMeetingWebhookException();
    }
  }

  private async requestToken(
    clientId: string,
    clientSecret: string,
    body: URLSearchParams,
  ): Promise<MeetingOAuthTokens> {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new MeetingProviderRejectedException(
        typeof data.reason === 'string'
          ? data.reason
          : typeof data.error === 'string'
            ? data.error
            : 'Zoom token exchange failed.',
      );
    }
    const accessToken = typeof data.access_token === 'string' ? data.access_token : null;
    if (!accessToken) {
      throw new MeetingProviderRejectedException('Zoom token response missing access_token.');
    }
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
    return {
      accessToken,
      refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : null,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes:
        typeof data.scope === 'string'
          ? data.scope.split(' ').map((s) => s.trim()).filter(Boolean)
          : [],
      externalAccountId: typeof data.account_id === 'string' ? data.account_id : null,
    };
  }

  private async api<T>(
    credentials: MeetingProviderCredentials,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!credentials.accessToken) {
      throw new MeetingProviderNotConfiguredException('Zoom access token is missing.');
    }
    const response = await fetch(`${ZOOM_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) {
      return undefined as T;
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new MeetingProviderRejectedException(
        typeof data.message === 'string' ? data.message : `Zoom API ${method} ${path} failed.`,
      );
    }
    return data as T;
  }

  private toResult(data: Record<string, unknown>): ProviderMeetingResult {
    const id =
      typeof data.id === 'string' || typeof data.id === 'number' ? String(data.id) : null;
    const joinUrl = typeof data.join_url === 'string' ? data.join_url : null;
    if (!id || !joinUrl) {
      throw new InvalidMeetingRequestException('Zoom meeting response was incomplete.');
    }
    return {
      provider: this.name,
      providerMeetingId: id,
      joinUrl,
      hostUrl: typeof data.start_url === 'string' ? data.start_url : null,
      passcode: typeof data.password === 'string' ? data.password : null,
      startsAt: typeof data.start_time === 'string' ? new Date(data.start_time) : null,
      timezone: typeof data.timezone === 'string' ? data.timezone : null,
      metadata: {
        uuid: data.uuid,
        duration: data.duration,
        hostId: data.host_id,
      },
    };
  }

  private extractObject(payload: Record<string, unknown>): Record<string, unknown> {
    const envelope =
      payload.payload && typeof payload.payload === 'object'
        ? (payload.payload as Record<string, unknown>)
        : payload;
    if (envelope.object && typeof envelope.object === 'object') {
      return envelope.object as Record<string, unknown>;
    }
    return envelope;
  }

  private mapType(event: string): NormalizedMeetingWebhookEvent['eventType'] {
    switch (event) {
      case 'meeting.created':
        return 'meeting.created';
      case 'meeting.updated':
        return 'meeting.updated';
      case 'meeting.deleted':
        return 'meeting.deleted';
      case 'meeting.started':
        return 'meeting.started';
      case 'meeting.ended':
        return 'meeting.ended';
      case 'recording.completed':
        return 'recording.completed';
      case 'meeting.participant_joined':
        return 'participant.joined';
      case 'meeting.participant_left':
        return 'participant.left';
      default:
        return 'unknown';
    }
  }

  private header(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | null {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) return value[0] ?? null;
    return typeof value === 'string' ? value : null;
  }
}
