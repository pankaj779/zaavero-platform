export const MEETING_PROVIDERS = ['NONE', 'ZOOM', 'GOOGLE_MEET', 'CUSTOM', 'SANDBOX'] as const;
export type MeetingProviderValue = (typeof MEETING_PROVIDERS)[number];

export const PROVISIONABLE_MEETING_PROVIDERS = ['ZOOM', 'GOOGLE_MEET', 'SANDBOX'] as const;
export type ProvisionableMeetingProvider = (typeof PROVISIONABLE_MEETING_PROVIDERS)[number];

export const MEETING_INTEGRATION_STATUSES = [
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'ERROR',
  'REVOKED',
] as const;
export type MeetingIntegrationStatusValue = (typeof MEETING_INTEGRATION_STATUSES)[number];

export const MEETING_SYNC_STATUSES = ['IDLE', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'] as const;
export type MeetingSyncStatusValue = (typeof MEETING_SYNC_STATUSES)[number];

export const MEETING_WEBHOOK_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'IGNORED',
] as const;
export type MeetingWebhookStatusValue = (typeof MEETING_WEBHOOK_STATUSES)[number];

export const MEETING_RECORDING_STATUSES = [
  'PENDING',
  'AVAILABLE',
  'PROCESSING',
  'FAILED',
  'DELETED',
] as const;
export type MeetingRecordingStatusValue = (typeof MEETING_RECORDING_STATUSES)[number];

export const MEETING_AUDIT_ENTITY = 'Meeting';

export const MEETING_AUDIT_ACTIONS = {
  integrationConnected: 'meeting.integration.connected',
  integrationDisconnected: 'meeting.integration.disconnected',
  meetingProvisioned: 'meeting.session.provisioned',
  meetingUpdated: 'meeting.session.updated',
  meetingDeleted: 'meeting.session.deleted',
  meetingStarted: 'meeting.session.started',
  meetingEnded: 'meeting.session.ended',
  meetingCancelled: 'meeting.session.cancelled',
  webhookProcessed: 'meeting.webhook.processed',
  recordingAvailable: 'meeting.recording.available',
  participantJoined: 'meeting.participant.joined',
  participantLeft: 'meeting.participant.left',
} as const;

export const ZOOM_OAUTH_SCOPES = [
  'meeting:write:admin',
  'meeting:read:admin',
  'recording:read:admin',
  'user:read:admin',
] as const;

export const GOOGLE_MEET_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
] as const;

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const TOKEN_REFRESH_SKEW_MS = 60 * 1000;
