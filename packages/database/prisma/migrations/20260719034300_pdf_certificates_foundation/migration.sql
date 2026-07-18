-- AlterEnum
ALTER TYPE "media_entity_type" ADD VALUE 'PAYMENT_RECEIPT_PDF';
ALTER TYPE "media_entity_type" ADD VALUE 'REFUND_RECEIPT_PDF';

-- AlterTable
ALTER TABLE "payments"
    ADD COLUMN "receipt_pdf_url" TEXT;

-- AlterTable
ALTER TABLE "refunds"
    ADD COLUMN "receipt_pdf_url" TEXT;

-- AlterTable
ALTER TABLE "certificates"
    ADD COLUMN "completed_at" TIMESTAMP(3);
