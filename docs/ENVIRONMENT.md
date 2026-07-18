# Environment Variables

Single source of truth for configuration. Copy [`.env.example`](../.env.example) to `.env` at the repository root. Nest validates config via `apps/api/src/config/env.schema.ts`.

Never commit real secrets.

## Application

| Variable       | Required | Default                 | Description                             |
| -------------- | -------- | ----------------------- | --------------------------------------- |
| `NODE_ENV`     | No       | `development`           | `development` \| `test` \| `production` |
| `APP_NAME`     | No       | `Graphology Platform`   | Product name (Swagger title, emails)    |
| `APP_URL`      | No       | `http://localhost:3000` | Public web URL                          |
| `FRONTEND_URL` | No       | falls back to `APP_URL` | Links in verification / reset emails    |
| `API_URL`      | No       | `http://localhost:3001` | Public API base (without `/api/v1`)     |
| `PORT`         | No       | `3001`                  | API listen port                         |
| `HOST`         | No       | `0.0.0.0`               | API bind host                           |
| `CORS_ORIGIN`  | No       | `http://localhost:3000` | Comma-separated allowed origins         |

## Database

| Variable       | Required | Description                            |
| -------------- | -------- | -------------------------------------- |
| `DATABASE_URL` | Yes      | Prisma connection (pooled URL on Neon) |
| `DIRECT_URL`   | Yes      | Direct URL for migrations              |

## Authentication

| Variable                   | Required | Alias                    | Description                      |
| -------------------------- | -------- | ------------------------ | -------------------------------- |
| `JWT_SECRET`               | Yes      | —                        | Access token signing secret      |
| `JWT_EXPIRES_IN`           | No       | `JWT_ACCESS_EXPIRATION`  | Access token TTL (default `15m`) |
| `REFRESH_TOKEN_SECRET`     | Yes      | `JWT_REFRESH_SECRET`     | Pepper for refresh-token hashing |
| `REFRESH_TOKEN_EXPIRES_IN` | No       | `JWT_REFRESH_EXPIRATION` | Refresh TTL (default `7d`)       |

## Email (Resend)

| Variable                          | Required   | Alias               | Description                                                                           |
| --------------------------------- | ---------- | ------------------- | ------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`                  | Production | —                   | Resend API key; optional when local sandbox mode is enabled                           |
| `RESEND_WEBHOOK_SECRET`           | Production | —                   | Resend signing secret used to verify webhook events                                   |
| `EMAIL_FROM`                      | Production | `RESEND_FROM_EMAIL` | Default From address; local default is `no-reply@graphology.local`                    |
| `EMAIL_REPLY_TO`                  | No         | —                   | Default Reply-To address                                                              |
| `EMAIL_PROVIDER`                  | No         | —                   | `RESEND` or `SANDBOX`; defaults to `RESEND`                                           |
| `EMAIL_SANDBOX_MODE`              | No         | —                   | Captures email locally; defaults on outside production and is forbidden in production |
| `EMAIL_QUEUE_POLL_INTERVAL_MS`    | No         | —                   | Queue polling interval; defaults to `15000`                                           |
| `EMAIL_QUEUE_BATCH_SIZE`          | No         | —                   | Queue batch size from 1–100; defaults to `20`                                         |
| `EMAIL_MAX_ATTEMPTS`              | No         | —                   | Delivery attempts from 1–10; defaults to `5`                                          |
| `EMAIL_WEBHOOK_TOLERANCE_SECONDS` | No         | —                   | Maximum webhook timestamp age; defaults to `300`                                      |

## Payments (placeholders until payments module)

| Variable          | Required | Alias                 | Description     |
| ----------------- | -------- | --------------------- | --------------- |
| `RAZORPAY_KEY_ID` | Yes      | —                     | Razorpay key id |
| `RAZORPAY_SECRET` | Yes      | `RAZORPAY_KEY_SECRET` | Razorpay secret |

## Storage (Cloudinary)

| Variable                            | Required   | Default      | Description                                                                            |
| ----------------------------------- | ---------- | ------------ | -------------------------------------------------------------------------------------- |
| `STORAGE_PROVIDER`                  | No         | `CLOUDINARY` | `CLOUDINARY` or `SANDBOX`; sandbox is forbidden in production                          |
| `STORAGE_SANDBOX_MODE`              | No         | —            | Captures assets locally; defaults on outside production and is forbidden in production |
| `CLOUDINARY_CLOUD_NAME`             | Production | —            | Cloudinary cloud name; required in production when the provider is `CLOUDINARY`        |
| `CLOUDINARY_API_KEY`                | Production | —            | Cloudinary API key; required in production when the provider is `CLOUDINARY`           |
| `CLOUDINARY_API_SECRET`             | Production | —            | Cloudinary API secret; server-only, never exposed to clients                           |
| `CLOUDINARY_FOLDER_ROOT`            | No         | `graphology` | Root folder for all uploaded assets                                                    |
| `STORAGE_SIGNED_UPLOAD_TTL_SECONDS` | No         | `600`        | Validity window (60–3600s) for signed direct-upload parameters                         |
| `STORAGE_MAX_FILE_SIZE_BYTES`       | No         | `104857600`  | Maximum size for direct (signed) uploads                                               |
| `STORAGE_SERVER_UPLOAD_MAX_BYTES`   | No         | `10485760`   | Maximum size for multipart server uploads                                              |
| `STORAGE_ALLOWED_MIME_TYPES`        | No         | built-ins    | Comma-separated MIME allow list; defaults to common image/video/PDF/zip/text types     |

## Optional

| Variable                                    | Description                     |
| ------------------------------------------- | ------------------------------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Future Google OAuth             |
| `SEED_ADMIN_*`                              | Database seed admin credentials |

## App-specific examples

- Root: [`.env.example`](../.env.example)
- API: [`apps/api/.env.example`](../apps/api/.env.example)
- Web: [`apps/web/.env.example`](../apps/web/.env.example)
- Database: [`packages/database/.env.example`](../packages/database/.env.example)
