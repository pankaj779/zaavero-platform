-- Phase 15 video meeting foundation

-- Enums
ALTER TYPE "meeting_provider" ADD VALUE IF NOT EXISTS 'SANDBOX';

CREATE TYPE "meeting_integration_status" AS ENUM (
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'ERROR',
  'REVOKED'
);

CREATE TYPE "meeting_sync_status" AS ENUM (
  'IDLE',
  'PENDING',
  'SYNCING',
  'SYNCED',
  'FAILED'
);

CREATE TYPE "meeting_webhook_event_status" AS ENUM (
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'IGNORED'
);

CREATE TYPE "meeting_recording_status" AS ENUM (
  'PENDING',
  'AVAILABLE',
  'PROCESSING',
  'FAILED',
  'DELETED'
);

CREATE TYPE "attendance_source" AS ENUM (
  'MANUAL',
  'PROVIDER',
  'SYSTEM'
);

ALTER TYPE "media_entity_type" ADD VALUE IF NOT EXISTS 'MEETING_RECORDING';
ALTER TYPE "media_entity_type" ADD VALUE IF NOT EXISTS 'MEETING_RECORDING_THUMBNAIL';

-- LiveSession extensions
ALTER TABLE "live_sessions"
  ADD COLUMN IF NOT EXISTS "meeting_integration_id" UUID,
  ADD COLUMN IF NOT EXISTS "provider_meeting_id" TEXT,
  ADD COLUMN IF NOT EXISTS "host_url_encrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "passcode_encrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS "recurrence_rule" TEXT,
  ADD COLUMN IF NOT EXISTS "provider_metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "sync_status" "meeting_sync_status" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN IF NOT EXISTS "sync_error" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ended_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "created_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "updated_by_id" UUID;

-- Attendance extensions
ALTER TABLE "attendances"
  ADD COLUMN IF NOT EXISTS "first_joined_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_left_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "duration_seconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "join_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "source" "attendance_source" NOT NULL DEFAULT 'MANUAL';

-- Notification dedupe
ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "dedupe_key" TEXT;

-- Calendar extensions
ALTER TABLE "calendar_events"
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS "recurrence_rule" TEXT,
  ADD COLUMN IF NOT EXISTS "sync_status" "meeting_sync_status" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN IF NOT EXISTS "sync_error" TEXT;

-- MeetingIntegration
CREATE TABLE "meeting_integrations" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "provider" "meeting_provider" NOT NULL,
  "status" "meeting_integration_status" NOT NULL DEFAULT 'DISCONNECTED',
  "external_account_id" TEXT,
  "external_account_email" TEXT,
  "access_token_cipher" TEXT,
  "refresh_token_cipher" TEXT,
  "token_iv" TEXT,
  "token_auth_tag" TEXT,
  "token_expires_at" TIMESTAMP(3),
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "config" JSONB,
  "last_error" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "connected_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "connected_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meeting_integrations_pkey" PRIMARY KEY ("id")
);

-- MeetingOAuthState
CREATE TABLE "meeting_oauth_states" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "integration_id" UUID,
  "user_id" UUID NOT NULL,
  "provider" "meeting_provider" NOT NULL,
  "state_hash" TEXT NOT NULL,
  "code_verifier_cipher" TEXT NOT NULL,
  "redirect_path" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meeting_oauth_states_pkey" PRIMARY KEY ("id")
);

-- MeetingWebhookEvent
CREATE TABLE "meeting_webhook_events" (
  "id" UUID NOT NULL,
  "organization_id" UUID,
  "integration_id" UUID,
  "provider" "meeting_provider" NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "status" "meeting_webhook_event_status" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB NOT NULL,
  "signature_hash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "locked_at" TIMESTAMP(3),
  "locked_by" TEXT,
  "last_error" TEXT,
  "occurred_at" TIMESTAMP(3),
  "processed_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meeting_webhook_events_pkey" PRIMARY KEY ("id")
);

-- MeetingParticipant
CREATE TABLE "meeting_participants" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "live_session_id" UUID NOT NULL,
  "user_id" UUID,
  "student_id" UUID,
  "provider_participant_id" TEXT NOT NULL,
  "provider_join_id" TEXT NOT NULL,
  "display_name" TEXT,
  "email_hash" TEXT,
  "joined_at" TIMESTAMP(3) NOT NULL,
  "left_at" TIMESTAMP(3),
  "duration_seconds" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'PROVIDER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- MeetingRecording
CREATE TABLE "meeting_recordings" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "live_session_id" UUID NOT NULL,
  "provider_recording_id" TEXT NOT NULL,
  "media_asset_id" UUID,
  "thumbnail_media_asset_id" UUID,
  "status" "meeting_recording_status" NOT NULL DEFAULT 'PENDING',
  "recording_type" TEXT,
  "play_url" TEXT,
  "download_url" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "duration_seconds" INTEGER,
  "size_bytes" BIGINT,
  "mime_type" TEXT,
  "checksum_sha256" TEXT,
  "provider_download_expires_at" TIMESTAMP(3),
  "ingestion_error" TEXT,
  "available_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meeting_recordings_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "meeting_integrations"
  ADD CONSTRAINT "meeting_integrations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_integrations"
  ADD CONSTRAINT "meeting_integrations_connected_by_id_fkey"
  FOREIGN KEY ("connected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "live_sessions"
  ADD CONSTRAINT "live_sessions_meeting_integration_id_fkey"
  FOREIGN KEY ("meeting_integration_id") REFERENCES "meeting_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "live_sessions"
  ADD CONSTRAINT "live_sessions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "live_sessions"
  ADD CONSTRAINT "live_sessions_updated_by_id_fkey"
  FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_oauth_states"
  ADD CONSTRAINT "meeting_oauth_states_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_oauth_states"
  ADD CONSTRAINT "meeting_oauth_states_integration_id_fkey"
  FOREIGN KEY ("integration_id") REFERENCES "meeting_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_oauth_states"
  ADD CONSTRAINT "meeting_oauth_states_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_webhook_events"
  ADD CONSTRAINT "meeting_webhook_events_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_webhook_events"
  ADD CONSTRAINT "meeting_webhook_events_integration_id_fkey"
  FOREIGN KEY ("integration_id") REFERENCES "meeting_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_participants"
  ADD CONSTRAINT "meeting_participants_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_participants"
  ADD CONSTRAINT "meeting_participants_live_session_id_fkey"
  FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_participants"
  ADD CONSTRAINT "meeting_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_participants"
  ADD CONSTRAINT "meeting_participants_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_recordings"
  ADD CONSTRAINT "meeting_recordings_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_recordings"
  ADD CONSTRAINT "meeting_recordings_live_session_id_fkey"
  FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_recordings"
  ADD CONSTRAINT "meeting_recordings_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_recordings"
  ADD CONSTRAINT "meeting_recordings_thumbnail_media_asset_id_fkey"
  FOREIGN KEY ("thumbnail_media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Uniques / indexes
CREATE UNIQUE INDEX "meeting_integrations_organization_id_provider_key"
  ON "meeting_integrations"("organization_id", "provider");

CREATE INDEX "meeting_integrations_organization_id_status_idx"
  ON "meeting_integrations"("organization_id", "status");

CREATE INDEX "meeting_integrations_provider_status_idx"
  ON "meeting_integrations"("provider", "status");

CREATE INDEX "meeting_integrations_token_expires_at_idx"
  ON "meeting_integrations"("token_expires_at");

CREATE UNIQUE INDEX "meeting_oauth_states_state_hash_key"
  ON "meeting_oauth_states"("state_hash");

CREATE INDEX "meeting_oauth_states_organization_id_provider_idx"
  ON "meeting_oauth_states"("organization_id", "provider");

CREATE INDEX "meeting_oauth_states_expires_at_idx"
  ON "meeting_oauth_states"("expires_at");

CREATE INDEX "meeting_oauth_states_user_id_idx"
  ON "meeting_oauth_states"("user_id");

CREATE UNIQUE INDEX "meeting_webhook_events_provider_event_id_key"
  ON "meeting_webhook_events"("provider", "event_id");

CREATE INDEX "meeting_webhook_events_status_received_at_idx"
  ON "meeting_webhook_events"("status", "received_at");

CREATE INDEX "meeting_webhook_events_organization_id_received_at_idx"
  ON "meeting_webhook_events"("organization_id", "received_at");

CREATE INDEX "meeting_webhook_events_integration_id_received_at_idx"
  ON "meeting_webhook_events"("integration_id", "received_at");

CREATE INDEX "meeting_webhook_events_event_type_idx"
  ON "meeting_webhook_events"("event_type");

CREATE UNIQUE INDEX "meeting_participants_live_session_id_provider_join_id_key"
  ON "meeting_participants"("live_session_id", "provider_join_id");

CREATE INDEX "meeting_participants_organization_id_live_session_id_idx"
  ON "meeting_participants"("organization_id", "live_session_id");

CREATE INDEX "meeting_participants_student_id_idx"
  ON "meeting_participants"("student_id");

CREATE INDEX "meeting_participants_user_id_idx"
  ON "meeting_participants"("user_id");

CREATE INDEX "meeting_participants_joined_at_idx"
  ON "meeting_participants"("joined_at");

CREATE UNIQUE INDEX "meeting_recordings_live_session_id_provider_recording_id_key"
  ON "meeting_recordings"("live_session_id", "provider_recording_id");

CREATE INDEX "meeting_recordings_organization_id_status_idx"
  ON "meeting_recordings"("organization_id", "status");

CREATE INDEX "meeting_recordings_live_session_id_status_idx"
  ON "meeting_recordings"("live_session_id", "status");

CREATE INDEX "meeting_recordings_media_asset_id_idx"
  ON "meeting_recordings"("media_asset_id");

CREATE INDEX "meeting_recordings_deleted_at_idx"
  ON "meeting_recordings"("deleted_at");

CREATE UNIQUE INDEX "live_sessions_meeting_integration_id_provider_meeting_id_key"
  ON "live_sessions"("meeting_integration_id", "provider_meeting_id");

CREATE INDEX "live_sessions_organization_id_meeting_provider_status_idx"
  ON "live_sessions"("organization_id", "meeting_provider", "status");

CREATE INDEX "live_sessions_sync_status_updated_at_idx"
  ON "live_sessions"("sync_status", "updated_at");

CREATE UNIQUE INDEX "notifications_organization_id_user_id_channel_dedupe_key_key"
  ON "notifications"("organization_id", "user_id", "channel", "dedupe_key");

CREATE INDEX "calendar_events_sync_status_idx"
  ON "calendar_events"("sync_status");

-- Partial uniqueness: one active calendar event per live session
CREATE UNIQUE INDEX "calendar_events_active_live_session_id_key"
  ON "calendar_events"("live_session_id")
  WHERE "live_session_id" IS NOT NULL AND "deleted_at" IS NULL;
