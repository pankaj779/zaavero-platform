-- CreateEnum
CREATE TYPE "email_provider" AS ENUM ('RESEND');

-- CreateEnum
CREATE TYPE "email_delivery_status" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "email_queue_status" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "email_event_status" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "email_event_type" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'OTHER');

-- CreateEnum
CREATE TYPE "email_template_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "email_invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "email_invitation_type" AS ENUM ('ORGANIZATION', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "email_category" AS ENUM ('SECURITY', 'SYSTEM', 'MARKETING', 'ANNOUNCEMENT', 'ASSIGNMENT', 'COURSE', 'PAYMENT', 'CERTIFICATE', 'LIVE_CLASS');

-- CreateEnum
CREATE TYPE "email_digest_mode" AS ENUM ('IMMEDIATE', 'DAILY', 'WEEKLY', 'OFF');

-- CreateEnum
CREATE TYPE "email_attachment_disposition" AS ENUM ('ATTACHMENT', 'INLINE');

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "queue_id" UUID,
    "initiated_by_id" UUID,
    "provider" "email_provider" NOT NULL DEFAULT 'RESEND',
    "provider_message_id" TEXT,
    "from_address" TEXT NOT NULL,
    "reply_to" TEXT,
    "to" TEXT[] NOT NULL,
    "cc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "template_key" TEXT,
    "template_version" INTEGER,
    "category" "email_category" NOT NULL DEFAULT 'SYSTEM',
    "status" "email_delivery_status" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "queued_at" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "complained_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "created_by_id" UUID,
    "scope_key" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "preview" TEXT,
    "variable_schema" JSONB NOT NULL,
    "category" "email_category" NOT NULL,
    "status" "email_template_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_queue" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "template_id" UUID,
    "created_by_id" UUID,
    "template_key" TEXT,
    "template_version" INTEGER,
    "variables" JSONB,
    "from_address" TEXT,
    "reply_to" TEXT,
    "to" TEXT[] NOT NULL,
    "cc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "rendered_subject" TEXT,
    "rendered_html" TEXT,
    "rendered_text" TEXT,
    "headers" JSONB,
    "tags" JSONB,
    "attachment_descriptors" JSONB,
    "category" "email_category" NOT NULL DEFAULT 'SYSTEM',
    "status" "email_queue_status" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "backoff_seconds" INTEGER NOT NULL DEFAULT 60,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "dead_lettered_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "correlation_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_preferences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "announcements" BOOLEAN NOT NULL DEFAULT true,
    "assignments" BOOLEAN NOT NULL DEFAULT true,
    "courses" BOOLEAN NOT NULL DEFAULT true,
    "payments" BOOLEAN NOT NULL DEFAULT true,
    "certificates" BOOLEAN NOT NULL DEFAULT true,
    "live_classes" BOOLEAN NOT NULL DEFAULT true,
    "system" BOOLEAN NOT NULL DEFAULT true,
    "digest_mode" "email_digest_mode" NOT NULL DEFAULT 'IMMEDIATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_attachments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "queue_id" UUID,
    "log_id" UUID,
    "filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "url" TEXT,
    "content_id" TEXT,
    "disposition" "email_attachment_disposition" NOT NULL DEFAULT 'ATTACHMENT',
    "checksum" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "log_id" UUID,
    "provider" "email_provider" NOT NULL,
    "event_id" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "type" "email_event_type" NOT NULL,
    "status" "email_event_status" NOT NULL DEFAULT 'PENDING',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_invitations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "invited_by_id" UUID,
    "accepted_by_id" UUID,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "type" "email_invitation_type" NOT NULL,
    "status" "email_invitation_status" NOT NULL DEFAULT 'PENDING',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_provider_provider_message_id_key" ON "email_logs"("provider", "provider_message_id");
CREATE INDEX "email_logs_organization_id_status_created_at_idx" ON "email_logs"("organization_id", "status", "created_at");
CREATE INDEX "email_logs_organization_id_category_created_at_idx" ON "email_logs"("organization_id", "category", "created_at");
CREATE INDEX "email_logs_user_id_created_at_idx" ON "email_logs"("user_id", "created_at");
CREATE INDEX "email_logs_queue_id_idx" ON "email_logs"("queue_id");
CREATE INDEX "email_logs_template_key_template_version_idx" ON "email_logs"("template_key", "template_version");
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_scope_key_key_locale_version_key" ON "email_templates"("scope_key", "key", "locale", "version");
CREATE INDEX "email_templates_organization_id_key_locale_status_idx" ON "email_templates"("organization_id", "key", "locale", "status");
CREATE INDEX "email_templates_key_locale_status_idx" ON "email_templates"("key", "locale", "status");
CREATE INDEX "email_templates_created_at_idx" ON "email_templates"("created_at");
CREATE UNIQUE INDEX "email_templates_one_active_version_key" ON "email_templates"("scope_key", "key", "locale") WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "email_queue_organization_id_idempotency_key_key" ON "email_queue"("organization_id", "idempotency_key");
CREATE INDEX "email_queue_status_available_at_priority_idx" ON "email_queue"("status", "available_at", "priority");
CREATE INDEX "email_queue_organization_id_status_available_at_idx" ON "email_queue"("organization_id", "status", "available_at");
CREATE INDEX "email_queue_user_id_created_at_idx" ON "email_queue"("user_id", "created_at");
CREATE INDEX "email_queue_template_id_idx" ON "email_queue"("template_id");
CREATE INDEX "email_queue_correlation_id_idx" ON "email_queue"("correlation_id");
CREATE INDEX "email_queue_entity_type_entity_id_idx" ON "email_queue"("entity_type", "entity_id");
CREATE INDEX "email_queue_locked_at_idx" ON "email_queue"("locked_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_preferences_organization_id_user_id_key" ON "email_preferences"("organization_id", "user_id");
CREATE INDEX "email_preferences_user_id_idx" ON "email_preferences"("user_id");
CREATE INDEX "email_preferences_organization_id_digest_mode_idx" ON "email_preferences"("organization_id", "digest_mode");

-- CreateIndex
CREATE INDEX "email_attachments_organization_id_created_at_idx" ON "email_attachments"("organization_id", "created_at");
CREATE INDEX "email_attachments_queue_id_idx" ON "email_attachments"("queue_id");
CREATE INDEX "email_attachments_log_id_idx" ON "email_attachments"("log_id");
CREATE INDEX "email_attachments_content_id_idx" ON "email_attachments"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_events_provider_event_id_key" ON "email_events"("provider", "event_id");
CREATE INDEX "email_events_status_received_at_idx" ON "email_events"("status", "received_at");
CREATE INDEX "email_events_organization_id_received_at_idx" ON "email_events"("organization_id", "received_at");
CREATE INDEX "email_events_provider_provider_message_id_idx" ON "email_events"("provider", "provider_message_id");
CREATE INDEX "email_events_log_id_occurred_at_idx" ON "email_events"("log_id", "occurred_at");
CREATE INDEX "email_events_user_id_occurred_at_idx" ON "email_events"("user_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_invitations_token_hash_key" ON "email_invitations"("token_hash");
CREATE INDEX "email_invitations_organization_id_email_type_status_idx" ON "email_invitations"("organization_id", "email", "type", "status");
CREATE INDEX "email_invitations_email_status_idx" ON "email_invitations"("email", "status");
CREATE INDEX "email_invitations_expires_at_status_idx" ON "email_invitations"("expires_at", "status");
CREATE INDEX "email_invitations_invited_by_id_idx" ON "email_invitations"("invited_by_id");
CREATE INDEX "email_invitations_accepted_by_id_idx" ON "email_invitations"("accepted_by_id");
CREATE UNIQUE INDEX "email_invitations_one_pending_key" ON "email_invitations"("organization_id", LOWER("email"), "type") WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "email_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_initiated_by_id_fkey" FOREIGN KEY ("initiated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "email_queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "email_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_invitations" ADD CONSTRAINT "email_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_invitations" ADD CONSTRAINT "email_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_invitations" ADD CONSTRAINT "email_invitations_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain checks not expressible in the Prisma schema.
ALTER TABLE "email_logs"
    ADD CONSTRAINT "email_logs_recipients_check" CHECK (cardinality("to") > 0),
    ADD CONSTRAINT "email_logs_attempts_check" CHECK ("attempts" >= 0),
    ADD CONSTRAINT "email_logs_template_version_check" CHECK ("template_version" IS NULL OR "template_version" > 0);

ALTER TABLE "email_templates"
    ADD CONSTRAINT "email_templates_scope_check" CHECK (
        ("organization_id" IS NULL AND "scope_key" = 'SYSTEM')
        OR
        ("organization_id" IS NOT NULL AND "scope_key" = "organization_id"::TEXT)
    ),
    ADD CONSTRAINT "email_templates_version_check" CHECK ("version" > 0),
    ADD CONSTRAINT "email_templates_key_check" CHECK ("key" ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
    ADD CONSTRAINT "email_templates_locale_check" CHECK ("locale" ~ '^[a-z]{2}(-[A-Z]{2})?$');

ALTER TABLE "email_queue"
    ADD CONSTRAINT "email_queue_recipients_check" CHECK (cardinality("to") > 0),
    ADD CONSTRAINT "email_queue_attempts_check" CHECK (
        "attempts" >= 0
        AND "max_attempts" > 0
        AND "attempts" <= "max_attempts"
        AND "backoff_seconds" >= 0
    ),
    ADD CONSTRAINT "email_queue_template_version_check" CHECK ("template_version" IS NULL OR "template_version" > 0),
    ADD CONSTRAINT "email_queue_payload_check" CHECK (
        "template_id" IS NOT NULL
        OR "template_key" IS NOT NULL
        OR ("rendered_subject" IS NOT NULL AND ("rendered_html" IS NOT NULL OR "rendered_text" IS NOT NULL))
    ),
    ADD CONSTRAINT "email_queue_dead_letter_check" CHECK (
        ("status" <> 'DEAD_LETTER' OR "dead_lettered_at" IS NOT NULL)
        AND ("status" <> 'CANCELLED' OR "cancelled_at" IS NOT NULL)
    );

ALTER TABLE "email_attachments"
    ADD CONSTRAINT "email_attachments_size_check" CHECK ("size_bytes" >= 0),
    ADD CONSTRAINT "email_attachments_parent_check" CHECK ("queue_id" IS NOT NULL OR "log_id" IS NOT NULL),
    ADD CONSTRAINT "email_attachments_reference_check" CHECK ("url" IS NOT NULL OR "content_id" IS NOT NULL),
    ADD CONSTRAINT "email_attachments_inline_check" CHECK ("disposition" <> 'INLINE' OR "content_id" IS NOT NULL);

ALTER TABLE "email_events"
    ADD CONSTRAINT "email_events_attempts_check" CHECK ("attempts" >= 0),
    ADD CONSTRAINT "email_events_signature_hash_check" CHECK (length("signature_hash") > 0);

ALTER TABLE "email_invitations"
    ADD CONSTRAINT "email_invitations_email_check" CHECK (length(trim("email")) > 3),
    ADD CONSTRAINT "email_invitations_role_check" CHECK (length(trim("role")) > 0),
    ADD CONSTRAINT "email_invitations_token_hash_check" CHECK (length("token_hash") >= 32),
    ADD CONSTRAINT "email_invitations_expiry_check" CHECK ("expires_at" > "created_at"),
    ADD CONSTRAINT "email_invitations_state_check" CHECK (
        ("status" = 'ACCEPTED' AND "accepted_at" IS NOT NULL AND "accepted_by_id" IS NOT NULL AND "revoked_at" IS NULL)
        OR ("status" = 'REVOKED' AND "revoked_at" IS NOT NULL AND "accepted_at" IS NULL)
        OR ("status" IN ('PENDING', 'EXPIRED') AND "accepted_at" IS NULL AND "revoked_at" IS NULL)
    );

-- Preserve immutable template version content while allowing lifecycle status
-- and audit timestamps to change.
CREATE FUNCTION prevent_email_template_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        NEW."organization_id" IS DISTINCT FROM OLD."organization_id"
        OR NEW."scope_key" IS DISTINCT FROM OLD."scope_key"
        OR NEW."key" IS DISTINCT FROM OLD."key"
        OR NEW."locale" IS DISTINCT FROM OLD."locale"
        OR NEW."version" IS DISTINCT FROM OLD."version"
        OR NEW."subject" IS DISTINCT FROM OLD."subject"
        OR NEW."html" IS DISTINCT FROM OLD."html"
        OR NEW."text" IS DISTINCT FROM OLD."text"
        OR NEW."preview" IS DISTINCT FROM OLD."preview"
        OR NEW."variable_schema" IS DISTINCT FROM OLD."variable_schema"
        OR NEW."category" IS DISTINCT FROM OLD."category"
        OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    ) THEN
        RAISE EXCEPTION 'email template version content is immutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "email_templates_immutable_version"
BEFORE UPDATE ON "email_templates"
FOR EACH ROW
EXECUTE FUNCTION prevent_email_template_version_mutation();
