import { createHash } from 'node:crypto';
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

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

@Injectable()
export class GoogleMeetProvider implements MeetingProvider {
  readonly name = 'GOOGLE_MEET' as const;

  isConfigured(credentials?: MeetingProviderCredentials | null): boolean {
    if (!credentials) return false;
    return Boolean(credentials.clientId && credentials.clientSecret);
  }

  buildAuthorizeUrl(input: MeetingOAuthAuthorizeInput): string {
    const clientId = process.env.GOOGLE_MEET_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '';
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', input.state);
    url.searchParams.set(
      'scope',
      (input.scopes ?? []).join(' ') ||
        'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
    );
    if (input.codeChallenge) {
      url.searchParams.set('code_challenge', input.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    return url.toString();
  }

  async exchangeCode(input: MeetingOAuthExchangeInput): Promise<MeetingOAuthTokens> {
    const clientId =
      input.clientId ?? process.env.GOOGLE_MEET_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      input.clientSecret ??
      process.env.GOOGLE_MEET_CLIENT_SECRET ??
      process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new MeetingProviderNotConfiguredException(
        'Google Meet OAuth credentials are not configured.',
      );
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    if (input.codeVerifier) {
      body.set('code_verifier', input.codeVerifier);
    }
    return this.requestToken(body);
  }

  async refreshTokens(credentials: MeetingProviderCredentials): Promise<MeetingOAuthTokens> {
    if (!credentials.refreshToken || !credentials.clientId || !credentials.clientSecret) {
      throw new MeetingProviderNotConfiguredException(
        'Google Meet refresh credentials are incomplete.',
      );
    }
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    });
    return this.requestToken(body);
  }

  async createMeeting(
    credentials: MeetingProviderCredentials,
    input: CreateProviderMeetingInput,
  ): Promise<ProviderMeetingResult> {
    const requestId = createHash('sha256')
      .update(`${input.liveSessionId}:${input.startsAt.toISOString()}`)
      .digest('hex')
      .slice(0, 32);
    const body = {
      summary: input.title,
      description: input.description ?? undefined,
      start: {
        dateTime: input.startsAt.toISOString(),
        timeZone: input.timezone,
      },
      end: {
        dateTime: (input.endsAt ?? new Date(input.startsAt.getTime() + 60 * 60 * 1000)).toISOString(),
        timeZone: input.timezone,
      },
      attendees: (input.attendeeEmails ?? []).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      ...(input.recurrenceRule ? { recurrence: [input.recurrenceRule] } : {}),
    };
    const data = await this.api<Record<string, unknown>>(
      credentials,
      'POST',
      '/calendars/primary/events?conferenceDataVersion=1',
      body,
    );
    return this.toResult(data);
  }

  async updateMeeting(
    credentials: MeetingProviderCredentials,
    input: UpdateProviderMeetingInput,
  ): Promise<ProviderMeetingResult> {
    const patch: Record<string, unknown> = {};
    if (input.title) patch.summary = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.startsAt || input.timezone) {
      patch.start = {
        dateTime: (input.startsAt ?? new Date()).toISOString(),
        timeZone: input.timezone ?? 'Asia/Kolkata',
      };
    }
    if (input.endsAt || input.timezone) {
      patch.end = {
        dateTime: (
          input.endsAt ?? new Date((input.startsAt ?? new Date()).getTime() + 60 * 60 * 1000)
        ).toISOString(),
        timeZone: input.timezone ?? 'Asia/Kolkata',
      };
    }
    if (input.recurrenceRule !== undefined) {
      patch.recurrence = input.recurrenceRule ? [input.recurrenceRule] : [];
    }
    const data = await this.api<Record<string, unknown>>(
      credentials,
      'PATCH',
      `/calendars/primary/events/${encodeURIComponent(input.providerMeetingId)}?conferenceDataVersion=1`,
      patch,
    );
    return this.toResult(data);
  }

  async deleteMeeting(
    credentials: MeetingProviderCredentials,
    providerMeetingId: string,
  ): Promise<void> {
    await this.api(
      credentials,
      'DELETE',
      `/calendars/primary/events/${encodeURIComponent(providerMeetingId)}`,
    );
  }

  verifyAndParseWebhook(input: MeetingWebhookVerificationInput): NormalizedMeetingWebhookEvent {
    // Google Calendar push notifications are channel headers; body may be empty.
    const channelId = this.header(input.headers, 'x-goog-channel-id');
    const resourceId = this.header(input.headers, 'x-goog-resource-id');
    const resourceState = this.header(input.headers, 'x-goog-resource-state') ?? 'unknown';
    const messageNumber = this.header(input.headers, 'x-goog-message-number') ?? '0';
    if (!channelId || !resourceId) {
      // Allow JSON sandbox-style payloads for local tests.
      if (!input.rawBody.trim()) {
        throw new InvalidMeetingWebhookException('Google Meet webhook headers are missing.');
      }
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(input.rawBody) as Record<string, unknown>;
      } catch {
        throw new InvalidMeetingWebhookException('Google Meet webhook body must be JSON.');
      }
      const rawType = typeof payload.event === 'string' ? payload.event : 'unknown';
      return {
        eventId: typeof payload.eventId === 'string' ? payload.eventId : hashValue(input.rawBody),
        eventType: this.mapType(rawType),
        rawType,
        payload,
        signatureHash: hashValue(input.rawBody),
        providerMeetingId:
          typeof payload.providerMeetingId === 'string' ? payload.providerMeetingId : null,
      };
    }

    return {
      eventId: `google-${channelId}-${resourceId}-${messageNumber}`,
      eventType: resourceState === 'sync' ? 'unknown' : 'meeting.updated',
      rawType: resourceState,
      payload: {
        channelId,
        resourceId,
        resourceState,
        messageNumber,
      },
      signatureHash: hashValue(`${channelId}:${resourceId}:${messageNumber}`),
      providerMeetingId: resourceId,
    };
  }

  private async requestToken(body: URLSearchParams): Promise<MeetingOAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new MeetingProviderRejectedException(
        typeof data.error_description === 'string'
          ? data.error_description
          : 'Google token exchange failed.',
      );
    }
    const accessToken = typeof data.access_token === 'string' ? data.access_token : null;
    if (!accessToken) {
      throw new MeetingProviderRejectedException('Google token response missing access_token.');
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
    };
  }

  private async api<T>(
    credentials: MeetingProviderCredentials,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!credentials.accessToken) {
      throw new MeetingProviderNotConfiguredException('Google access token is missing.');
    }
    const response = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
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
      const errorObj =
        data.error && typeof data.error === 'object'
          ? (data.error as Record<string, unknown>)
          : null;
      const message =
        errorObj && typeof errorObj.message === 'string'
          ? errorObj.message
          : 'Google Calendar API failed.';
      throw new MeetingProviderRejectedException(message);
    }
    return data as T;
  }

  private toResult(data: Record<string, unknown>): ProviderMeetingResult {
    const id = typeof data.id === 'string' ? data.id : null;
    const hangoutLink = typeof data.hangoutLink === 'string' ? data.hangoutLink : null;
    const entryPoints =
      data.conferenceData &&
      typeof data.conferenceData === 'object' &&
      Array.isArray((data.conferenceData as Record<string, unknown>).entryPoints)
        ? ((data.conferenceData as Record<string, unknown>).entryPoints as Record<string, unknown>[])
        : [];
    const videoEntry = entryPoints.find((p) => p.entryPointType === 'video');
    const joinUrl =
      hangoutLink ??
      (videoEntry && typeof videoEntry.uri === 'string' ? videoEntry.uri : null);
    if (!id || !joinUrl) {
      throw new InvalidMeetingRequestException('Google Meet response was incomplete.');
    }
    const start =
      data.start && typeof data.start === 'object'
        ? (data.start as Record<string, unknown>)
        : null;
    const end =
      data.end && typeof data.end === 'object' ? (data.end as Record<string, unknown>) : null;
    return {
      provider: this.name,
      providerMeetingId: id,
      joinUrl,
      hostUrl: joinUrl,
      passcode:
        videoEntry && typeof videoEntry.passcode === 'string' ? videoEntry.passcode : null,
      startsAt: typeof start?.dateTime === 'string' ? new Date(start.dateTime) : null,
      endsAt: typeof end?.dateTime === 'string' ? new Date(end.dateTime) : null,
      timezone: typeof start?.timeZone === 'string' ? start.timeZone : null,
      metadata: {
        htmlLink: data.htmlLink,
        iCalUID: data.iCalUID,
        conferenceId:
          data.conferenceData && typeof data.conferenceData === 'object'
            ? (data.conferenceData as Record<string, unknown>).conferenceId
            : null,
      },
    };
  }

  private mapType(rawType: string): NormalizedMeetingWebhookEvent['eventType'] {
    switch (rawType) {
      case 'meeting.created':
      case 'meeting.updated':
      case 'meeting.deleted':
      case 'meeting.started':
      case 'meeting.ended':
      case 'recording.completed':
      case 'participant.joined':
      case 'participant.left':
        return rawType;
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
