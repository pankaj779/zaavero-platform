-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "payment_order_status" AS ENUM ('DRAFT', 'CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('CREATED', 'AUTHENTICATED', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "plan_tier" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "billing_interval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "order_purpose" AS ENUM ('COURSE_PURCHASE', 'ORGANIZATION_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "coupon_type" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "payment_event_status" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "payment_event_type" AS ENUM ('ORDER_PAID', 'PAYMENT_AUTHORIZED', 'PAYMENT_CAPTURED', 'PAYMENT_FAILED', 'REFUND_CREATED', 'REFUND_PROCESSED', 'REFUND_FAILED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_CHARGED', 'SUBSCRIPTION_PAUSED', 'SUBSCRIPTION_CANCELLED', 'OTHER');

-- CreateEnum
CREATE TYPE "payment_method_type" AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'EMI', 'BANK_TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "currency" CHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "is_purchasable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price_minor" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_by_id" UUID,
    "provider" "payment_provider" NOT NULL DEFAULT 'RAZORPAY',
    "purpose" "order_purpose" NOT NULL,
    "status" "payment_order_status" NOT NULL DEFAULT 'DRAFT',
    "course_id" UUID,
    "batch_id" UUID,
    "plan_id" UUID,
    "coupon_id" UUID,
    "course_title_snapshot" TEXT,
    "batch_name_snapshot" TEXT,
    "plan_name_snapshot" TEXT,
    "plan_tier_snapshot" "plan_tier",
    "interval_snapshot" "billing_interval",
    "subtotal_minor" INTEGER NOT NULL,
    "discount_minor" INTEGER NOT NULL DEFAULT 0,
    "tax_minor" INTEGER NOT NULL DEFAULT 0,
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "receipt" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "payment_method_id" UUID,
    "provider" "payment_provider" NOT NULL,
    "provider_payment_id" TEXT,
    "provider_order_id" TEXT,
    "idempotency_key" TEXT,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'CREATED',
    "failure_code" TEXT,
    "failure_description" TEXT,
    "failure_source" TEXT,
    "failure_step" TEXT,
    "failure_reason" TEXT,
    "authorized_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3),
    "refunded_minor" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "subscription_id" UUID,
    "customer_id" UUID NOT NULL,
    "billing_address_id" UUID,
    "created_by_id" UUID,
    "voided_by_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'DRAFT',
    "subtotal_minor" INTEGER NOT NULL,
    "discount_minor" INTEGER NOT NULL DEFAULT 0,
    "tax_minor" INTEGER NOT NULL DEFAULT 0,
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "billing_address_snapshot" JSONB NOT NULL,
    "issued_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID,
    "tier" "plan_tier" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "interval" "billing_interval" NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "source_order_id" UUID,
    "created_by_id" UUID,
    "cancelled_by_id" UUID,
    "provider" "payment_provider" NOT NULL,
    "provider_subscription_id" TEXT,
    "status" "subscription_status" NOT NULL DEFAULT 'CREATED',
    "plan_name_snapshot" TEXT NOT NULL,
    "plan_tier_snapshot" "plan_tier" NOT NULL,
    "interval_snapshot" "billing_interval" NOT NULL,
    "amount_minor_snapshot" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancel_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "trial_ends_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "coupon_type" NOT NULL,
    "amount_off_minor" INTEGER,
    "percent_off_bps" INTEGER,
    "currency" CHAR(3),
    "minimum_order_minor" INTEGER,
    "maximum_discount_minor" INTEGER,
    "max_redemptions" INTEGER,
    "redemption_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "requested_by_id" UUID,
    "provider" "payment_provider" NOT NULL,
    "provider_refund_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "refund_status" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "failure_code" TEXT,
    "failure_reason" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "order_id" UUID,
    "payment_id" UUID,
    "refund_id" UUID,
    "subscription_id" UUID,
    "provider" "payment_provider" NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" "payment_event_type" NOT NULL,
    "status" "payment_event_status" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "provider_method_id" TEXT,
    "type" "payment_method_type" NOT NULL,
    "display_name" TEXT,
    "card_network" TEXT,
    "card_last4" CHAR(4),
    "card_issuer" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "upi_handle_masked" TEXT,
    "bank_name" TEXT,
    "wallet_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_addresses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "label" TEXT,
    "full_name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "phone" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "billing_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_orders_organization_id_status_created_at_idx" ON "payment_orders"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "payment_orders_customer_id_created_at_idx" ON "payment_orders"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_orders_course_id_idx" ON "payment_orders"("course_id");

-- CreateIndex
CREATE INDEX "payment_orders_batch_id_idx" ON "payment_orders"("batch_id");

-- CreateIndex
CREATE INDEX "payment_orders_plan_id_idx" ON "payment_orders"("plan_id");

-- CreateIndex
CREATE INDEX "payment_orders_coupon_id_idx" ON "payment_orders"("coupon_id");

-- CreateIndex
CREATE INDEX "payment_orders_expires_at_idx" ON "payment_orders"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_organization_id_idempotency_key_key" ON "payment_orders"("organization_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_provider_receipt_key" ON "payment_orders"("provider", "receipt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_provider_provider_order_id_key" ON "payment_orders"("provider", "provider_order_id");

-- CreateIndex
CREATE INDEX "payments_organization_id_status_created_at_idx" ON "payments"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_customer_id_created_at_idx" ON "payments"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_provider_order_id_idx" ON "payments"("provider_order_id");

-- CreateIndex
CREATE INDEX "payments_payment_method_id_idx" ON "payments"("payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_payment_id_key" ON "payments"("provider", "provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_organization_id_idempotency_key_key" ON "payments"("organization_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_organization_id_status_created_at_idx" ON "invoices"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "invoices_customer_id_created_at_idx" ON "invoices"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "invoices_subscription_id_idx" ON "invoices"("subscription_id");

-- CreateIndex
CREATE INDEX "invoices_billing_address_id_idx" ON "invoices"("billing_address_id");

-- CreateIndex
CREATE INDEX "plans_organization_id_is_active_idx" ON "plans"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "plans_tier_idx" ON "plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "plans_organization_id_tier_interval_key" ON "plans"("organization_id", "tier", "interval");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_source_order_id_key" ON "subscriptions"("source_order_id");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_status_idx" ON "subscriptions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_provider_subscription_id_key" ON "subscriptions"("provider", "provider_subscription_id");

-- CreateIndex
CREATE INDEX "coupons_organization_id_is_active_idx" ON "coupons"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "coupons_expires_at_idx" ON "coupons"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_organization_id_code_key" ON "coupons"("organization_id", "code");

-- CreateIndex
CREATE INDEX "refunds_organization_id_status_created_at_idx" ON "refunds"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_provider_provider_refund_id_key" ON "refunds"("provider", "provider_refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_organization_id_idempotency_key_key" ON "refunds"("organization_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "payment_events_status_received_at_idx" ON "payment_events"("status", "received_at");

-- CreateIndex
CREATE INDEX "payment_events_organization_id_received_at_idx" ON "payment_events"("organization_id", "received_at");

-- CreateIndex
CREATE INDEX "payment_events_order_id_idx" ON "payment_events"("order_id");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events"("payment_id");

-- CreateIndex
CREATE INDEX "payment_events_refund_id_idx" ON "payment_events"("refund_id");

-- CreateIndex
CREATE INDEX "payment_events_subscription_id_idx" ON "payment_events"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_event_id_key" ON "payment_events"("provider", "event_id");

-- CreateIndex
CREATE INDEX "payment_methods_organization_id_user_id_idx" ON "payment_methods"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_is_default_idx" ON "payment_methods"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "payment_methods_deleted_at_idx" ON "payment_methods"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_provider_provider_method_id_key" ON "payment_methods"("provider", "provider_method_id");

-- CreateIndex
CREATE INDEX "billing_addresses_organization_id_user_id_idx" ON "billing_addresses"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "billing_addresses_organization_id_is_default_idx" ON "billing_addresses"("organization_id", "is_default");

-- CreateIndex
CREATE INDEX "billing_addresses_deleted_at_idx" ON "billing_addresses"("deleted_at");

-- CreateIndex
CREATE INDEX "courses_organization_id_is_purchasable_idx" ON "courses"("organization_id", "is_purchasable");

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "billing_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_voided_by_id_fkey" FOREIGN KEY ("voided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_source_order_id_fkey" FOREIGN KEY ("source_order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain checks not expressible in the Prisma schema.
ALTER TABLE "courses"
    ADD CONSTRAINT "courses_price_minor_check" CHECK ("price_minor" >= 0),
    ADD CONSTRAINT "courses_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "payment_orders"
    ADD CONSTRAINT "payment_orders_amounts_check" CHECK (
        "subtotal_minor" >= 0
        AND "discount_minor" >= 0
        AND "tax_minor" >= 0
        AND "total_minor" >= 0
        AND "discount_minor" <= "subtotal_minor"
        AND "total_minor" = "subtotal_minor" - "discount_minor" + "tax_minor"
    ),
    ADD CONSTRAINT "payment_orders_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT "payment_orders_target_check" CHECK (
        ("purpose" = 'COURSE_PURCHASE' AND "course_id" IS NOT NULL AND "plan_id" IS NULL)
        OR
        ("purpose" = 'ORGANIZATION_SUBSCRIPTION' AND "plan_id" IS NOT NULL AND "course_id" IS NULL AND "batch_id" IS NULL)
    );

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_amount_check" CHECK (
        "amount_minor" > 0
        AND "refunded_minor" >= 0
        AND "refunded_minor" <= "amount_minor"
    ),
    ADD CONSTRAINT "payments_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_amounts_check" CHECK (
        "subtotal_minor" >= 0
        AND "discount_minor" >= 0
        AND "tax_minor" >= 0
        AND "total_minor" >= 0
        AND "discount_minor" <= "subtotal_minor"
        AND "total_minor" = "subtotal_minor" - "discount_minor" + "tax_minor"
    ),
    ADD CONSTRAINT "invoices_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "plans"
    ADD CONSTRAINT "plans_amount_check" CHECK ("amount_minor" >= 0),
    ADD CONSTRAINT "plans_trial_days_check" CHECK ("trial_days" >= 0),
    ADD CONSTRAINT "plans_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_amount_check" CHECK ("amount_minor_snapshot" >= 0),
    ADD CONSTRAINT "subscriptions_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT "subscriptions_period_check" CHECK ("current_period_end" > "current_period_start");

ALTER TABLE "coupons"
    ADD CONSTRAINT "coupons_definition_check" CHECK (
        (
            "type" = 'FIXED_AMOUNT'
            AND "amount_off_minor" IS NOT NULL
            AND "amount_off_minor" > 0
            AND "percent_off_bps" IS NULL
            AND "currency" IS NOT NULL
        )
        OR
        (
            "type" = 'PERCENTAGE'
            AND "amount_off_minor" IS NULL
            AND "percent_off_bps" BETWEEN 1 AND 10000
        )
    ),
    ADD CONSTRAINT "coupons_limits_check" CHECK (
        ("minimum_order_minor" IS NULL OR "minimum_order_minor" >= 0)
        AND ("maximum_discount_minor" IS NULL OR "maximum_discount_minor" > 0)
        AND ("max_redemptions" IS NULL OR "max_redemptions" > 0)
        AND "redemption_count" >= 0
        AND ("max_redemptions" IS NULL OR "redemption_count" <= "max_redemptions")
    ),
    ADD CONSTRAINT "coupons_currency_check" CHECK ("currency" IS NULL OR "currency" ~ '^[A-Z]{3}$');

ALTER TABLE "refunds"
    ADD CONSTRAINT "refunds_amount_check" CHECK ("amount_minor" > 0),
    ADD CONSTRAINT "refunds_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "payment_events"
    ADD CONSTRAINT "payment_events_attempts_check" CHECK ("attempts" >= 0);

ALTER TABLE "payment_methods"
    ADD CONSTRAINT "payment_methods_expiry_month_check" CHECK ("expiry_month" IS NULL OR "expiry_month" BETWEEN 1 AND 12),
    ADD CONSTRAINT "payment_methods_expiry_year_check" CHECK ("expiry_year" IS NULL OR "expiry_year" >= 2000),
    ADD CONSTRAINT "payment_methods_card_last4_check" CHECK ("card_last4" IS NULL OR "card_last4" ~ '^[0-9]{4}$');

ALTER TABLE "billing_addresses"
    ADD CONSTRAINT "billing_addresses_country_code_check" CHECK ("country_code" ~ '^[A-Z]{2}$');
