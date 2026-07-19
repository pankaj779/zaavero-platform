-- Phase 16 AI platform foundation (pgvector + AI tables)

CREATE EXTENSION IF NOT EXISTS vector;

-- AuditLog tenancy
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "organization_id" UUID;

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "audit_logs_organization_id_created_at_idx"
  ON "audit_logs"("organization_id", "created_at");

-- Enums
CREATE TYPE "ai_provider" AS ENUM (
  'OPENAI', 'AZURE_OPENAI', 'ANTHROPIC', 'GOOGLE_GEMINI',
  'OLLAMA', 'OPENROUTER', 'GROQ', 'SANDBOX'
);
CREATE TYPE "ai_model_type" AS ENUM ('CHAT', 'EMBEDDING', 'MODERATION');
CREATE TYPE "ai_message_role" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');
CREATE TYPE "ai_feature" AS ENUM (
  'TUTOR', 'LESSON_SUMMARY', 'ASSIGNMENT_HELP', 'QUIZ_GENERATOR',
  'FLASHCARDS', 'COURSE_DESCRIPTION', 'CERTIFICATE_FEEDBACK',
  'ANNOUNCEMENT_WRITER', 'EMAIL_WRITER', 'PERFORMANCE_INSIGHTS',
  'ADMIN_INSIGHTS', 'SEMANTIC_SEARCH', 'GENERAL'
);
CREATE TYPE "ai_document_source_type" AS ENUM (
  'COURSE', 'LESSON', 'ASSIGNMENT', 'MEDIA_ASSET', 'NOTE'
);
CREATE TYPE "ai_document_status" AS ENUM (
  'PENDING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'
);
CREATE TYPE "ai_job_type" AS ENUM (
  'EMBED_DOCUMENT', 'REINDEX_DOCUMENT', 'GENERATE_SUMMARY', 'GENERATE_QUIZ',
  'GENERATE_FLASHCARDS', 'GENERATE_INSIGHT', 'GENERATE_COURSE_COPY',
  'GENERATE_ANNOUNCEMENT', 'GENERATE_EMAIL', 'GENERATE_CERTIFICATE_REMARKS'
);
CREATE TYPE "ai_job_status" AS ENUM (
  'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER', 'CANCELLED'
);
CREATE TYPE "ai_usage_type" AS ENUM (
  'CHAT_COMPLETION', 'EMBEDDING', 'MODERATION', 'STRUCTURED_GENERATION', 'RESERVATION'
);
CREATE TYPE "ai_usage_status" AS ENUM ('RESERVED', 'COMMITTED', 'RELEASED', 'FAILED');
CREATE TYPE "ai_prompt_template_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ai_feedback_rating" AS ENUM ('UP', 'DOWN');

-- Conversations
CREATE TABLE "ai_conversations" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "course_id" UUID,
  "lesson_id" UUID,
  "assignment_id" UUID,
  "feature" "ai_feature" NOT NULL DEFAULT 'GENERAL',
  "title" TEXT,
  "provider" "ai_provider" NOT NULL,
  "model" TEXT NOT NULL,
  "pinned_at" TIMESTAMP(3),
  "last_message_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "ai_conversations_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_conversations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_conversations_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_conversations_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_conversations_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ai_conversations_organization_id_user_id_deleted_at_updated_at_idx"
  ON "ai_conversations"("organization_id", "user_id", "deleted_at", "updated_at");
CREATE INDEX "ai_conversations_organization_id_course_id_updated_at_idx"
  ON "ai_conversations"("organization_id", "course_id", "updated_at");
CREATE INDEX "ai_conversations_organization_id_feature_created_at_idx"
  ON "ai_conversations"("organization_id", "feature", "created_at");
CREATE INDEX "ai_conversations_pinned_at_idx" ON "ai_conversations"("pinned_at");
CREATE INDEX "ai_conversations_deleted_at_idx" ON "ai_conversations"("deleted_at");

-- Messages
CREATE TABLE "ai_messages" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "user_id" UUID,
  "parent_message_id" UUID,
  "role" "ai_message_role" NOT NULL,
  "content" TEXT NOT NULL,
  "provider" "ai_provider",
  "model" TEXT,
  "citations" JSONB,
  "safety_metadata" JSONB,
  "finish_reason" TEXT,
  "token_prompt" INTEGER NOT NULL DEFAULT 0,
  "token_completion" INTEGER NOT NULL DEFAULT 0,
  "latency_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "ai_messages_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_messages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_messages_parent_message_id_fkey"
    FOREIGN KEY ("parent_message_id") REFERENCES "ai_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");
CREATE INDEX "ai_messages_organization_id_user_id_created_at_idx" ON "ai_messages"("organization_id", "user_id", "created_at");
CREATE INDEX "ai_messages_parent_message_id_idx" ON "ai_messages"("parent_message_id");
CREATE INDEX "ai_messages_deleted_at_idx" ON "ai_messages"("deleted_at");

-- Documents
CREATE TABLE "ai_documents" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "created_by_id" UUID,
  "course_id" UUID,
  "lesson_id" UUID,
  "assignment_id" UUID,
  "media_asset_id" UUID,
  "source_type" "ai_document_source_type" NOT NULL,
  "source_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "extracted_text" TEXT,
  "checksum_sha256" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "ai_document_status" NOT NULL DEFAULT 'PENDING',
  "language" TEXT NOT NULL DEFAULT 'en',
  "chunk_count" INTEGER NOT NULL DEFAULT 0,
  "token_count" INTEGER NOT NULL DEFAULT 0,
  "error_code" TEXT,
  "error_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "ai_documents_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_documents_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_documents_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_documents_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_documents_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_documents_media_asset_id_fkey"
    FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_documents_source_consistency_check" CHECK (
    ("source_type" = 'COURSE' AND "course_id" IS NOT NULL) OR
    ("source_type" = 'LESSON' AND "lesson_id" IS NOT NULL) OR
    ("source_type" = 'ASSIGNMENT' AND "assignment_id" IS NOT NULL) OR
    ("source_type" = 'MEDIA_ASSET' AND "media_asset_id" IS NOT NULL) OR
    ("source_type" = 'NOTE')
  )
);

CREATE UNIQUE INDEX "ai_documents_organization_id_source_type_source_key_version_key"
  ON "ai_documents"("organization_id", "source_type", "source_key", "version");
CREATE INDEX "ai_documents_organization_id_status_updated_at_idx"
  ON "ai_documents"("organization_id", "status", "updated_at");
CREATE INDEX "ai_documents_organization_id_course_id_status_idx"
  ON "ai_documents"("organization_id", "course_id", "status");
CREATE INDEX "ai_documents_organization_id_lesson_id_idx" ON "ai_documents"("organization_id", "lesson_id");
CREATE INDEX "ai_documents_organization_id_assignment_id_idx" ON "ai_documents"("organization_id", "assignment_id");
CREATE INDEX "ai_documents_organization_id_media_asset_id_idx" ON "ai_documents"("organization_id", "media_asset_id");
CREATE INDEX "ai_documents_organization_id_checksum_sha256_idx" ON "ai_documents"("organization_id", "checksum_sha256");
CREATE INDEX "ai_documents_deleted_at_idx" ON "ai_documents"("deleted_at");

-- Embeddings
CREATE TABLE "ai_embeddings" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "token_count" INTEGER NOT NULL DEFAULT 0,
  "start_offset" INTEGER,
  "end_offset" INTEGER,
  "page_number" INTEGER,
  "provider" "ai_provider" NOT NULL,
  "model" TEXT NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_embeddings_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_embeddings_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "ai_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ai_embeddings_document_id_chunk_index_key" ON "ai_embeddings"("document_id", "chunk_index");
CREATE INDEX "ai_embeddings_organization_id_document_id_idx" ON "ai_embeddings"("organization_id", "document_id");
CREATE INDEX "ai_embeddings_organization_id_model_idx" ON "ai_embeddings"("organization_id", "model");
CREATE INDEX "ai_embeddings_embedding_hnsw_idx"
  ON "ai_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Jobs
CREATE TABLE "ai_jobs" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "requested_by_id" UUID,
  "document_id" UUID,
  "course_id" UUID,
  "lesson_id" UUID,
  "assignment_id" UUID,
  "conversation_id" UUID,
  "result_message_id" UUID,
  "type" "ai_job_type" NOT NULL,
  "status" "ai_job_status" NOT NULL DEFAULT 'QUEUED',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB,
  "result" JSONB,
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
  "idempotency_key" TEXT NOT NULL,
  "correlation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_jobs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_requested_by_id_fkey"
    FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "ai_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_jobs_result_message_id_fkey"
    FOREIGN KEY ("result_message_id") REFERENCES "ai_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ai_jobs_organization_id_idempotency_key_key"
  ON "ai_jobs"("organization_id", "idempotency_key");
CREATE INDEX "ai_jobs_status_available_at_priority_idx"
  ON "ai_jobs"("status", "available_at", "priority");
CREATE INDEX "ai_jobs_organization_id_status_available_at_idx"
  ON "ai_jobs"("organization_id", "status", "available_at");
CREATE INDEX "ai_jobs_document_id_status_idx" ON "ai_jobs"("document_id", "status");
CREATE INDEX "ai_jobs_requested_by_id_created_at_idx" ON "ai_jobs"("requested_by_id", "created_at");
CREATE INDEX "ai_jobs_locked_at_idx" ON "ai_jobs"("locked_at");
CREATE INDEX "ai_jobs_correlation_id_idx" ON "ai_jobs"("correlation_id");

-- Usage ledger
CREATE TABLE "ai_usages" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "user_id" UUID,
  "conversation_id" UUID,
  "message_id" UUID,
  "job_id" UUID,
  "provider" "ai_provider" NOT NULL,
  "model" TEXT NOT NULL,
  "model_type" "ai_model_type" NOT NULL,
  "usage_type" "ai_usage_type" NOT NULL,
  "feature" "ai_feature" NOT NULL DEFAULT 'GENERAL',
  "status" "ai_usage_status" NOT NULL DEFAULT 'COMMITTED',
  "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
  "completion_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "reserved_tokens" INTEGER NOT NULL DEFAULT 0,
  "cost_micros" BIGINT NOT NULL DEFAULT 0,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "latency_ms" INTEGER,
  "retries" INTEGER NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error_code" TEXT,
  "request_id" TEXT NOT NULL,
  "correlation_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_usages_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_usages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_usages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_usages_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "ai_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_usages_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "ai_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ai_usages_nonneg_check" CHECK (
    "prompt_tokens" >= 0 AND "completion_tokens" >= 0 AND "total_tokens" >= 0
    AND "reserved_tokens" >= 0 AND "cost_micros" >= 0 AND "retries" >= 0
  )
);

CREATE UNIQUE INDEX "ai_usages_organization_id_request_id_key" ON "ai_usages"("organization_id", "request_id");
CREATE INDEX "ai_usages_organization_id_created_at_idx" ON "ai_usages"("organization_id", "created_at");
CREATE INDEX "ai_usages_organization_id_user_id_created_at_idx" ON "ai_usages"("organization_id", "user_id", "created_at");
CREATE INDEX "ai_usages_organization_id_provider_model_created_at_idx"
  ON "ai_usages"("organization_id", "provider", "model", "created_at");
CREATE INDEX "ai_usages_organization_id_status_created_at_idx" ON "ai_usages"("organization_id", "status", "created_at");
CREATE INDEX "ai_usages_conversation_id_created_at_idx" ON "ai_usages"("conversation_id", "created_at");
CREATE INDEX "ai_usages_job_id_idx" ON "ai_usages"("job_id");
CREATE INDEX "ai_usages_success_created_at_idx" ON "ai_usages"("success", "created_at");

-- Prompt templates
CREATE TABLE "ai_prompt_templates" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID,
  "created_by_id" UUID,
  "scope_key" TEXT NOT NULL DEFAULT 'system',
  "key" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "version" INTEGER NOT NULL DEFAULT 1,
  "feature" "ai_feature" NOT NULL,
  "title" TEXT NOT NULL,
  "system_prompt" TEXT NOT NULL,
  "user_template" TEXT,
  "variable_schema" JSONB,
  "status" "ai_prompt_template_status" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_prompt_templates_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_prompt_templates_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ai_prompt_templates_scope_key_key_locale_version_key"
  ON "ai_prompt_templates"("scope_key", "key", "locale", "version");
CREATE UNIQUE INDEX "ai_prompt_templates_active_scope_key_key_locale_uidx"
  ON "ai_prompt_templates"("scope_key", "key", "locale")
  WHERE "status" = 'ACTIVE';
CREATE INDEX "ai_prompt_templates_organization_id_key_locale_status_idx"
  ON "ai_prompt_templates"("organization_id", "key", "locale", "status");
CREATE INDEX "ai_prompt_templates_feature_status_idx" ON "ai_prompt_templates"("feature", "status");

-- Feedback
CREATE TABLE "ai_feedback" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "message_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "rating" "ai_feedback_rating" NOT NULL,
  "reason" TEXT,
  "comment" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_feedback_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_feedback_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "ai_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ai_feedback_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ai_feedback_message_id_user_id_key" ON "ai_feedback"("message_id", "user_id");
CREATE INDEX "ai_feedback_organization_id_rating_created_at_idx"
  ON "ai_feedback"("organization_id", "rating", "created_at");
CREATE INDEX "ai_feedback_user_id_created_at_idx" ON "ai_feedback"("user_id", "created_at");
