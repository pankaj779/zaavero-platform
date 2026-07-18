-- CreateEnum
CREATE TYPE "media_entity_type" AS ENUM ('USER_AVATAR', 'ORG_LOGO', 'ORG_BRANDING', 'COURSE_THUMBNAIL', 'COURSE_BANNER', 'LESSON_VIDEO', 'LESSON_PDF', 'LESSON_ZIP', 'LESSON_ATTACHMENT', 'ASSIGNMENT_ATTACHMENT', 'SUBMISSION_ATTACHMENT', 'CERTIFICATE_PDF', 'CERTIFICATE_QR', 'INVOICE_PDF', 'MESSAGE_ATTACHMENT', 'ANNOUNCEMENT_IMAGE', 'CALENDAR_ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "storage_provider" AS ENUM ('CLOUDINARY', 'SANDBOX');

-- CreateEnum
CREATE TYPE "media_resource_type" AS ENUM ('IMAGE', 'VIDEO', 'RAW');

-- CreateEnum
CREATE TYPE "media_delivery_type" AS ENUM ('UPLOAD', 'PRIVATE', 'AUTHENTICATED');

-- AlterTable
ALTER TABLE "courses"
    ADD COLUMN "thumbnail_url" TEXT,
    ADD COLUMN "banner_url" TEXT;

-- AlterTable
ALTER TABLE "invoices"
    ADD COLUMN "pdf_url" TEXT;

-- AlterTable
ALTER TABLE "certificates"
    ADD COLUMN "qr_image_url" TEXT;

-- AlterTable
ALTER TABLE "assignments"
    ADD COLUMN "attachment_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "entity_type" "media_entity_type" NOT NULL,
    "entity_id" TEXT,
    "provider" "storage_provider" NOT NULL,
    "resource_type" "media_resource_type" NOT NULL,
    "delivery_type" "media_delivery_type" NOT NULL,
    "provider_public_id" TEXT NOT NULL,
    "provider_asset_id" TEXT,
    "folder" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "provider_etag" TEXT,
    "secure_url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "format" TEXT,
    "version" INTEGER NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_organization_id_provider_provider_public_id_key" ON "media_assets"("organization_id", "provider", "provider_public_id");
CREATE INDEX "media_assets_organization_id_entity_type_entity_id_idx" ON "media_assets"("organization_id", "entity_type", "entity_id");
CREATE INDEX "media_assets_organization_id_checksum_sha256_idx" ON "media_assets"("organization_id", "checksum_sha256");
CREATE INDEX "media_assets_owner_user_id_idx" ON "media_assets"("owner_user_id");
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets"("deleted_at");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain checks not expressible in the Prisma schema.
ALTER TABLE "media_assets"
    ADD CONSTRAINT "media_assets_bytes_check" CHECK ("bytes" >= 0),
    ADD CONSTRAINT "media_assets_dimensions_check" CHECK (
        ("width" IS NULL OR "width" > 0)
        AND ("height" IS NULL OR "height" > 0)
    ),
    ADD CONSTRAINT "media_assets_duration_check" CHECK ("duration_seconds" IS NULL OR "duration_seconds" >= 0),
    ADD CONSTRAINT "media_assets_version_check" CHECK ("version" >= 0),
    ADD CONSTRAINT "media_assets_checksum_sha256_check" CHECK ("checksum_sha256" ~ '^[A-Fa-f0-9]{64}$'),
    ADD CONSTRAINT "media_assets_provider_public_id_check" CHECK (length(trim("provider_public_id")) > 0),
    ADD CONSTRAINT "media_assets_secure_url_check" CHECK (length(trim("secure_url")) > 0);
